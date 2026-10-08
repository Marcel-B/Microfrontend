using System.Globalization;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text.Json;
using Mfe.HostBff;
using Mfe.HostBff.DevOverrides;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;

namespace Mfe.Bff.Tests;

/// <summary>Local overrides of remotes: the host BFF's switch and token endpoint, the remote BFF's CORS for stage shells.</summary>
public sealed class DevOverridesTests
{
    private const string StageShell = "https://shell.test.example";

    [Fact]
    public async Task Shell_learns_whether_the_stage_allows_overrides()
    {
        await using var off = await StartHostBffAsync();
        await using var on = await StartHostBffAsync(enabled: true);

        Assert.False(await DevOverridesFlag(off));
        Assert.True(await DevOverridesFlag(on));
    }

    [Fact]
    public async Task Token_endpoint_does_not_exist_unless_overrides_are_enabled()
    {
        await using var app = await StartHostBffAsync();
        var client = app.GetTestClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");
        client.DefaultRequestHeaders.Add("Cookie", await SessionCookieAsync(app));

        var response = await client.GetAsync("/bff/dev/token");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Token_endpoint_requires_csrf_header_and_session()
    {
        await using var app = await StartHostBffAsync(enabled: true);
        var client = app.GetTestClient();

        Assert.Equal(HttpStatusCode.BadRequest, (await client.GetAsync("/bff/dev/token")).StatusCode);
        client.DefaultRequestHeaders.Add("X-CSRF", "1");
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/bff/dev/token")).StatusCode);
    }

    [Fact]
    public async Task Token_endpoint_hands_the_session_access_token_to_the_shell()
    {
        await using var app = await StartHostBffAsync(enabled: true);
        var client = app.GetTestClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");
        client.DefaultRequestHeaders.Add("Cookie", await SessionCookieAsync(app));

        var response = await client.GetAsync("/bff/dev/token");

        response.EnsureSuccessStatusCode();
        var token = await response.Content.ReadFromJsonAsync<DevToken>();
        Assert.Equal("the-access-token", token!.AccessToken);
        Assert.NotNull(token.ExpiresAt);
        Assert.Equal("no-store", response.Headers.CacheControl?.ToString());
    }

    [Fact]
    public async Task Remote_bff_allows_the_stage_shell_listed_in_dev_cors()
    {
        await using var app = await RemoteBffTests.StartRemoteBffAsync(new() { ["DevCors:Origins:0"] = StageShell });

        var allowed = await PreflightAsync(app, StageShell);
        var other = await PreflightAsync(app, "https://evil.example");

        Assert.Equal(StageShell, allowed.Headers.GetValues("Access-Control-Allow-Origin").Single());
        var headers = allowed.Headers.GetValues("Access-Control-Allow-Headers").Single();
        Assert.Contains("authorization", headers, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("x-correlation-id", headers, StringComparison.OrdinalIgnoreCase);
        Assert.False(other.Headers.Contains("Access-Control-Allow-Origin"));
    }

    [Fact]
    public async Task Remote_bff_allows_no_cross_origin_calls_without_dev_cors()
    {
        await using var app = await RemoteBffTests.StartRemoteBffAsync();

        var response = await PreflightAsync(app, StageShell);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }

    private static Task<HttpResponseMessage> PreflightAsync(WebApplication app, string origin)
    {
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/me");
        request.Headers.Add("Origin", origin);
        request.Headers.Add("Access-Control-Request-Method", "GET");
        request.Headers.Add("Access-Control-Request-Headers", "authorization,x-csrf,x-correlation-id");
        return app.GetTestClient().SendAsync(request);
    }

    private static async Task<bool> DevOverridesFlag(WebApplication app) =>
        (await app.GetTestClient().GetFromJsonAsync<JsonElement>("/bff/remotes")).GetProperty("devOverrides").GetBoolean();

    /// <summary>A session as the OIDC login leaves it, from a test-only endpoint instead of the Identity server.</summary>
    private static async Task<string> SessionCookieAsync(WebApplication app)
    {
        var response = await app.GetTestClient().GetAsync("/test/signin");
        return string.Join("; ", response.Headers.GetValues("Set-Cookie").Select(cookie => cookie.Split(';')[0]));
    }

    private static Task<WebApplication> StartHostBffAsync(bool enabled = false) =>
        TestApps.StartAsync(
            "vue-host",
            builder => builder.AddHostBff(),
            app =>
            {
                app.UseHostBff();
                app.MapGet("/test/signin", async (HttpContext context) =>
                {
                    var properties = new AuthenticationProperties();
                    properties.StoreTokens(
                    [
                        new AuthenticationToken { Name = "access_token", Value = "the-access-token" },
                        new AuthenticationToken
                        {
                            Name = "expires_at",
                            Value = DateTimeOffset.UtcNow.AddHours(1).ToString("o", CultureInfo.InvariantCulture),
                        },
                    ]);
                    var user = new ClaimsPrincipal(new ClaimsIdentity([new Claim("sub", "1")], "test"));
                    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, user, properties);
                });
            },
            new() { ["DevOverrides:Enabled"] = enabled ? "true" : "false" });
}
