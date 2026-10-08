using System.Net;
using System.Net.Http.Json;
using Mfe.HostBff;
using Mfe.HostBff.Endpoints;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;

namespace Mfe.Bff.Tests;

public sealed class HostBffTests : IAsyncLifetime
{
    private WebApplication _app = null!;

    public async Task InitializeAsync() => _app = await StartHostBffAsync();

    public async Task DisposeAsync() => await _app.DisposeAsync();

    [Fact]
    public async Task User_endpoint_requires_csrf_header()
    {
        var response = await _app.GetTestClient().GetAsync("/bff/user");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task User_endpoint_returns_anonymous_user_without_session()
    {
        var client = _app.GetTestClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");

        var user = await client.GetFromJsonAsync<BffUser>("/bff/user");

        Assert.NotNull(user);
        Assert.False(user.IsAuthenticated);
        Assert.Empty(user.Roles);
    }

    [Fact]
    public async Task Remote_api_returns_401_instead_of_redirect_for_anonymous_users()
    {
        var client = _app.GetTestClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");

        var response = await client.GetAsync("/api/vue-demo/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Remote_registry_lists_pages_with_roles_and_titles_per_language()
    {
        var registry = await _app.GetTestClient().GetFromJsonAsync<RegistryDto>("/bff/remotes");

        Assert.NotNull(registry);
        var remote = Assert.Single(registry.Remotes);
        Assert.Equal("vueDemo", remote.Name);
        var admin = remote.Pages.Single(p => p.Path == "/admin");
        Assert.Contains("admin", admin.Roles);
        Assert.Equal("Klick-Demo", remote.Pages.Single(p => p.Path == "/demo").Title["de"]);
        Assert.Equal("Click demo", remote.Pages.Single(p => p.Path == "/demo").Title["en"]);
    }

    [Fact]
    public async Task Built_shell_is_served_with_index_html_as_fallback_for_client_routes()
    {
        var root = Directory.CreateTempSubdirectory("shell-").FullName;
        await File.WriteAllTextAsync(Path.Combine(root, "index.html"), "<html>shell</html>");
        await using var app = await StartHostBffAsync(new() { ["Shell:Root"] = root });

        var response = await app.GetTestClient().GetStringAsync("/demo");

        Assert.Equal("<html>shell</html>", response);
    }

    [Fact]
    public async Task Shell_dev_server_never_sees_cookies()
    {
        var (devServer, url) = await TestApps.StartDevServerAsync();
        await using var _ = devServer;
        await using var app = await StartHostBffAsync(new() { ["Shell:DevServer"] = url });
        var client = app.GetTestClient();
        // A logged-in browser on localhost: chunked sessions of both variants are over Node's 16 KB header limit.
        client.DefaultRequestHeaders.Add("Cookie", "mfe.vue.sessionC1=abc; mfe.react.sessionC1=def");

        var response = await client.GetStringAsync("/demo");

        Assert.Equal("no cookie", response);
    }

    [Theory]
    [InlineData("/debug", "/debug")]
    [InlineData("https://evil.example", "/")]
    [InlineData("//evil.example", "/")]
    [InlineData("/\\evil.example", "/")]
    [InlineData(null, "/")]
    public void Return_url_must_be_local(string? returnUrl, string expected)
    {
        Assert.Equal(expected, BffEndpoints.SafeReturnUrl(new DefaultHttpContext(), returnUrl));
    }

    private static Task<WebApplication> StartHostBffAsync(Dictionary<string, string?>? overrides = null) =>
        TestApps.StartAsync("vue-host", builder => builder.AddHostBff(), app => app.UseHostBff(), overrides);

    private sealed record RegistryDto(List<RemoteDto> Remotes);

    private sealed record RemoteDto(string Name, string Entry, List<PageDto> Pages);

    private sealed record PageDto(string Path, Dictionary<string, string> Title, List<string> Roles);
}
