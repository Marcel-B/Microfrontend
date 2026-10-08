using System.Net;
using System.Net.Http.Json;
using Mfe.Bff.Endpoints;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Mfe.Bff.Tests;

public sealed class BffEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task User_endpoint_requires_csrf_header()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/bff/user");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task User_endpoint_returns_anonymous_user_without_session()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-CSRF", "1");

        var user = await client.GetFromJsonAsync<BffUser>("/bff/user");

        Assert.NotNull(user);
        Assert.False(user.IsAuthenticated);
        Assert.Empty(user.Roles);
    }

    [Fact]
    public async Task Api_returns_401_instead_of_redirect_for_anonymous_users()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        client.DefaultRequestHeaders.Add("X-CSRF", "1");

        var response = await client.GetAsync("/api/anything");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Frontend_config_lists_remote_pages_with_roles()
    {
        var client = factory.CreateClient();

        var frontend = await client.GetFromJsonAsync<FrontendDto>("/bff/frontends/vue");

        Assert.NotNull(frontend);
        Assert.Equal("/vue/", frontend.BasePath);
        var admin = frontend.Remotes.SelectMany(r => r.Pages).Single(p => p.Path == "/admin");
        Assert.Contains("admin", admin.Roles);
    }

    [Fact]
    public async Task Root_redirects_to_default_frontend()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        var response = await client.GetAsync("/");

        Assert.Equal("/vue/", response.Headers.Location?.OriginalString);
    }

    [Theory]
    [InlineData("/vue/debug", "/vue/debug")]
    [InlineData("https://evil.example", "/")]
    [InlineData("//evil.example", "/")]
    [InlineData("/\\evil.example", "/")]
    [InlineData(null, "/")]
    public void Return_url_must_be_local(string? returnUrl, string expected)
    {
        Assert.Equal(expected, BffEndpoints.SafeReturnUrl(new DefaultHttpContext(), returnUrl));
    }

    private sealed record FrontendDto(string BasePath, List<RemoteDto> Remotes);

    private sealed record RemoteDto(string Name, string Entry, List<PageDto> Pages);

    private sealed record PageDto(string Path, List<string> Roles);
}
