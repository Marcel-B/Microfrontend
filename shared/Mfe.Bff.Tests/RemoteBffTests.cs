using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using Mfe.RemoteBff;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Mfe.Bff.Tests;

public sealed class RemoteBffTests : IAsyncLifetime
{
    private const string Issuer = "http://identity.test/";
    private static readonly SymmetricSecurityKey SigningKey = new("a-signing-key-that-is-long-enough-for-hs256"u8.ToArray());

    private WebApplication _app = null!;

    public async Task InitializeAsync() => _app = await StartRemoteBffAsync();

    public async Task DisposeAsync() => await _app.DisposeAsync();

    [Fact]
    public async Task Api_accepts_access_token_and_maps_name_and_roles()
    {
        var client = ClientWithToken(CreateToken(audience: "vue-demo-api", roles: ["admin", "user"]));

        var me = await client.GetFromJsonAsync<MeDto>("/api/me");

        Assert.NotNull(me);
        Assert.Equal("admin", me.Name);
        Assert.True(me.IsAdmin);
    }

    [Fact]
    public async Task Api_rejects_requests_without_token()
    {
        var response = await _app.GetTestClient().GetAsync("/api/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Api_rejects_tokens_for_another_audience()
    {
        var client = ClientWithToken(CreateToken(audience: "react-demo-api", roles: ["admin"]));

        var response = await client.GetAsync("/api/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Built_ui_is_served_under_its_base_path()
    {
        var root = Directory.CreateTempSubdirectory("remote-ui-").FullName;
        await File.WriteAllTextAsync(Path.Combine(root, "remoteEntry.js"), "export {}");
        await using var app = await StartRemoteBffAsync(new() { ["Ui:Root"] = root });

        var response = await app.GetTestClient().GetAsync("/remotes/vue-demo/remoteEntry.js");

        response.EnsureSuccessStatusCode();
        Assert.Equal("export {}", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Ui_dev_server_never_sees_cookies()
    {
        var (devServer, url) = await TestApps.StartDevServerAsync();
        await using var _ = devServer;
        await using var app = await StartRemoteBffAsync(new() { ["Ui:DevServer"] = url });
        var client = app.GetTestClient();
        client.DefaultRequestHeaders.Add("Cookie", "mfe.vue.sessionC1=abc");

        var response = await client.GetStringAsync("/remotes/vue-demo/remoteEntry.js");

        Assert.Equal("no cookie", response);
    }

    private HttpClient ClientWithToken(string token)
    {
        var client = _app.GetTestClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string CreateToken(string audience, string[] roles) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = audience,
            Expires = DateTime.UtcNow.AddMinutes(5),
            Claims = new Dictionary<string, object> { ["sub"] = "1", ["name"] = "admin", ["role"] = roles },
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256),
        });

    [Fact]
    public async Task Health_answers_without_token_and_is_ready_without_a_host()
    {
        var client = _app.GetTestClient();

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
    }

    /// <summary>Like the demo BFF, but without registering at a host unless a test asks for it.</summary>
    internal static Task<WebApplication> StartRemoteBffAsync(Dictionary<string, string?>? overrides = null) =>
        TestApps.StartAsync(
            "vue-demo",
            builder =>
            {
                builder.AddRemoteBff();
                // Same validation as in production, but with a local key instead of the Identity server's discovery document.
                builder.Services.PostConfigure<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme, options =>
                {
                    var configuration = new OpenIdConnectConfiguration { Issuer = Issuer };
                    configuration.SigningKeys.Add(SigningKey);
                    options.Configuration = configuration;
                    options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(configuration);
                });
            },
            app =>
            {
                app.UseRemoteBff();
                app.MapGet("/api/me", (ClaimsPrincipal user) => new MeDto(user.Identity?.Name, user.IsInRole("admin")))
                    .RequireAuthorization();
                app.MapRemoteUi();
            },
            new Dictionary<string, string?>(overrides ?? []) { ["Registration:HostUrl"] = overrides?.GetValueOrDefault("Registration:HostUrl") ?? "" });

    private sealed record MeDto(string? Name, bool IsAdmin);
}
