using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Mfe.HostBff;
using Mfe.HostBff.Registry.Adapters.Http;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;

namespace Mfe.Bff.Tests;

/// <summary>The registry through the host BFF's HTTP API, with real routing, authorization, YARP and health checks.</summary>
public sealed class RegistryHttpTests : IAsyncLifetime
{
    private const string DemoKey = "key-of-vue-demo";

    private WebApplication _host = null!;
    private WebApplication _remote = null!;
    private string _remoteUrl = null!;

    public async Task InitializeAsync()
    {
        // A stand-in for the remote BFF on a real socket: the host checks its health and forwards to it.
        (_remote, _remoteUrl) = await TestApps.StartDevServerAsync();
        _host = await TestApps.StartAsync(
            "vue-host",
            builder => builder.AddHostBff(),
            app =>
            {
                // Signs in like the OIDC callback would, with the given role.
                app.MapGet("/test/signin", (string role, HttpContext context) => context.SignInAsync(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    new ClaimsPrincipal(new ClaimsIdentity([new Claim("name", "tester"), new Claim("role", role)], "test", "name", "role"))));
                app.UseHostBff();
            },
            new()
            {
                ["Registry:ApiKeys:vue-demo"] = DemoKey,
                ["Registry:ApiKeys:vue-other"] = "key-of-vue-other",
            });
    }

    public async Task DisposeAsync()
    {
        await _host.DisposeAsync();
        await _remote.DisposeAsync();
    }

    [Fact]
    public async Task Registration_needs_a_known_api_key()
    {
        var anonymous = await _host.GetTestClient().PutAsJsonAsync("/registry/remotes/vue-demo", Registration());
        var unknown = await RemoteClient("not-a-key").PutAsJsonAsync("/registry/remotes/vue-demo", Registration());

        Assert.Equal(HttpStatusCode.Unauthorized, anonymous.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
    }

    [Fact]
    public async Task A_registered_remote_reaches_the_shell_and_is_forwarded_without_cookies()
    {
        var response = await RemoteClient().PutAsJsonAsync("/registry/remotes/vue-demo", Registration());

        response.EnsureSuccessStatusCode();
        var answer = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("registered", answer.GetProperty("outcome").GetString());
        Assert.Equal("healthy", answer.GetProperty("health").GetString());
        Assert.Equal(10, answer.GetProperty("heartbeatSeconds").GetInt32());

        var shell = await _host.GetTestClient().GetFromJsonAsync<JsonElement>("/bff/remotes");
        var remote = Assert.Single(shell.GetProperty("remotes").EnumerateArray());
        Assert.Equal("vueDemo", remote.GetProperty("name").GetString());
        Assert.Equal("Demo", remote.GetProperty("group").GetString());
        Assert.Equal("/remotes/vue-demo/remoteEntry.js", remote.GetProperty("entry").GetString());
        var admin = remote.GetProperty("pages").EnumerateArray().Single(p => p.GetProperty("path").GetString() == "/admin");
        Assert.True(admin.GetProperty("requiresAuth").GetBoolean());
        Assert.Equal("Administration", admin.GetProperty("title").GetProperty("en").GetString());

        var client = _host.GetTestClient();
        client.DefaultRequestHeaders.Add("Cookie", "mfe.vue.session=abc");
        Assert.Equal("no cookie", await client.GetStringAsync("/remotes/vue-demo/remoteEntry.js"));
    }

    [Fact]
    public async Task The_remote_api_needs_a_login()
    {
        await RemoteClient().PutAsJsonAsync("/registry/remotes/vue-demo", Registration());
        var client = _host.GetTestClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");

        var response = await client.GetAsync("/api/vue-demo/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Deregistration_removes_the_remote_and_its_routes()
    {
        var client = RemoteClient();
        await client.PutAsJsonAsync("/registry/remotes/vue-demo", Registration());

        var response = await client.DeleteAsync("/registry/remotes/vue-demo");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        var shell = await _host.GetTestClient().GetFromJsonAsync<JsonElement>("/bff/remotes");
        Assert.Empty(shell.GetProperty("remotes").EnumerateArray());
        Assert.Equal(HttpStatusCode.NotFound, (await _host.GetTestClient().GetAsync("/remotes/vue-demo/remoteEntry.js")).StatusCode);
    }

    [Fact]
    public async Task An_api_key_only_works_for_its_own_remote()
    {
        await RemoteClient().PutAsJsonAsync("/registry/remotes/vue-demo", Registration());
        var other = RemoteClient("key-of-vue-other");

        var takeOver = await other.PutAsJsonAsync("/registry/remotes/vue-demo", Registration());
        Assert.Equal(HttpStatusCode.Forbidden, takeOver.StatusCode);
        Assert.Contains("belongs to remote 'vue-other'", await takeOver.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.Forbidden, (await other.DeleteAsync("/registry/remotes/vue-demo")).StatusCode);
        Assert.Single((await _host.GetTestClient().GetFromJsonAsync<JsonElement>("/bff/remotes")).GetProperty("remotes").EnumerateArray());
    }

    [Fact]
    public async Task Invalid_and_colliding_registrations_are_explained()
    {
        var client = RemoteClient();

        var invalid = await client.PutAsJsonAsync("/registry/remotes/vue-demo", Registration(module: "DemoPage"));
        var withoutGroup = await client.PutAsJsonAsync("/registry/remotes/vue-demo", Registration(group: " "));
        var colliding = await client.PutAsJsonAsync("/registry/remotes/vue-demo", Registration(path: "/debug"));

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        Assert.Contains("pages[0].module", await invalid.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.BadRequest, withoutGroup.StatusCode);
        Assert.Contains("\"group\"", await withoutGroup.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.Conflict, colliding.StatusCode);
        Assert.Contains("belongs to the shell", await colliding.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Only_admins_see_the_registry()
    {
        await RemoteClient().PutAsJsonAsync("/registry/remotes/vue-demo", Registration());

        Assert.Equal(HttpStatusCode.Unauthorized, (await SessionClient(role: null).GetAsync("/bff/registry")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await SessionClient("user").GetAsync("/bff/registry")).StatusCode);

        var registry = await SessionClient("admin").GetFromJsonAsync<JsonElement>("/bff/registry");
        var remote = Assert.Single(registry.GetProperty("remotes").EnumerateArray());
        Assert.Equal("healthy", remote.GetProperty("health").GetString());
        Assert.Equal("vue-demo", remote.GetProperty("owner").GetString());
        Assert.Equal("Demo", remote.GetProperty("group").GetString());
        Assert.False(remote.GetProperty("apiScopeRequested").GetBoolean());
        Assert.Equal(["vue-demo", "vue-other"], registry.GetProperty("settings").GetProperty("apiKeys").EnumerateArray().Select(k => k.GetString()));
        Assert.DoesNotContain(DemoKey, registry.GetRawText());
        Assert.Contains(registry.GetProperty("history").EnumerateArray(), e => e.GetProperty("kind").GetString() == "registered");
    }

    [Fact]
    public async Task Registry_page_api_requires_csrf_header()
    {
        var client = await SignedInAsync("admin");

        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/bff/registry")).StatusCode);
    }

    [Fact]
    public async Task Swagger_ui_shows_the_registry_api()
    {
        var client = _host.GetTestClient();

        var document = await client.GetStringAsync("/openapi/v1.json");
        var ui = await client.GetAsync("/swagger/index.html");

        Assert.Contains("/registry/remotes/{id}", document);
        Assert.Contains("X-Api-Key", document);
        Assert.Equal(HttpStatusCode.OK, ui.StatusCode);
    }

    private HttpClient RemoteClient(string apiKey = DemoKey)
    {
        var client = _host.GetTestClient();
        client.DefaultRequestHeaders.Add(RegistryAuthorization.ApiKeyHeader, apiKey);
        return client;
    }

    private HttpClient SessionClient(string? role)
    {
        var client = role is null ? _host.GetTestClient() : SignedInAsync(role).GetAwaiter().GetResult();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");
        return client;
    }

    private async Task<HttpClient> SignedInAsync(string role)
    {
        var client = _host.GetTestClient();
        var response = await client.GetAsync($"/test/signin?role={role}");
        var cookies = response.Headers.GetValues("Set-Cookie").Select(c => c.Split(';')[0]);
        client.DefaultRequestHeaders.Add("Cookie", string.Join("; ", cookies));
        return client;
    }

    private object Registration(string path = "/demo", string module = "./DemoPage", string group = "Demo") => new
    {
        federationName = "vueDemo",
        address = _remoteUrl,
        version = "1.2.3",
        group,
        apiScope = "some-api",
        healthPath = "/health",
        pages = new object[]
        {
            new { path, title = new { de = "Klick-Demo", en = "Click demo" }, module, icon = "pi pi-star" },
            new { path = "/admin", title = new { de = "Administration", en = "Administration" }, module = "./AdminPage", roles = new[] { "admin" } },
        },
    };
}
