using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;

namespace Mfe.Bff.Tests;

/// <summary>A remote BFF registers at a fake host (and Identity server) on a real socket, renews and deregisters.</summary>
public sealed class HostRegistrationTests : IAsyncLifetime
{
    private readonly ConcurrentQueue<(string Method, string Path, string? Authorization, string Body)> _calls = new();
    private WebApplication _host = null!;
    private string _hostUrl = null!;

    public async Task InitializeAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        _host = builder.Build();
        _host.MapGet("/.well-known/openid-configuration", (HttpContext context) =>
            Results.Json(new Dictionary<string, string> { ["token_endpoint"] = $"{context.Request.Scheme}://{context.Request.Host}/connect/token" }));
        _host.MapPost("/connect/token", async (HttpContext context) =>
        {
            await RecordAsync(context);
            return Results.Json(new Dictionary<string, object> { ["access_token"] = "remote-token", ["expires_in"] = 300 });
        });
        _host.MapPut("/registry/remotes/{id}", async (string id, HttpContext context) =>
        {
            await RecordAsync(context);
            return Results.Json(new { id, outcome = _calls.Count(c => c.Method == "PUT") == 1 ? "registered" : "renewed", health = "healthy", heartbeatSeconds = 1 });
        });
        _host.MapDelete("/registry/remotes/{id}", async (HttpContext context) =>
        {
            await RecordAsync(context);
            return Results.NoContent();
        });
        await _host.StartAsync();
        _hostUrl = _host.Urls.Single();
    }

    public async Task DisposeAsync() => await _host.DisposeAsync();

    [Fact]
    public async Task Registers_with_its_pages_renews_and_deregisters_on_shutdown()
    {
        var remote = await RemoteBffTests.StartRemoteBffAsync(new()
        {
            ["Registration:HostUrl"] = _hostUrl,
            ["Registration:Authority"] = _hostUrl,
            ["Registration:Address"] = "http://localhost:5011",
            ["Registration:ClientSecret"] = "secret",
        });

        await WaitUntilAsync(async () => (await remote.GetTestClient().GetAsync("/health/ready")).StatusCode == HttpStatusCode.OK);
        await WaitUntilAsync(() => Task.FromResult(_calls.Count(c => c.Method == "PUT") >= 2));
        await remote.StopAsync();
        await remote.DisposeAsync();

        var token = Assert.Single(_calls, c => c.Path == "/connect/token");
        Assert.Contains("grant_type=client_credentials", token.Body);
        Assert.Contains("scope=vue-registry", token.Body);

        var put = _calls.First(c => c.Method == "PUT");
        Assert.Equal("/registry/remotes/vue-demo", put.Path);
        Assert.Equal("Bearer remote-token", put.Authorization);
        var body = JsonDocument.Parse(put.Body).RootElement;
        Assert.Equal("vueDemo", body.GetProperty("federationName").GetString());
        Assert.Equal("http://localhost:5011", body.GetProperty("address").GetString());
        Assert.Equal("vue-demo-api", body.GetProperty("apiScope").GetString());
        Assert.Equal(["/demo", "/admin"], body.GetProperty("pages").EnumerateArray().Select(p => p.GetProperty("path").GetString()));

        Assert.Equal("DELETE", _calls.Last().Method);
        Assert.Equal("/registry/remotes/vue-demo", _calls.Last().Path);
    }

    [Fact]
    public async Task Is_not_ready_while_the_host_is_unreachable()
    {
        await using var remote = await RemoteBffTests.StartRemoteBffAsync(new()
        {
            ["Registration:HostUrl"] = "http://127.0.0.1:9",
            ["Registration:TokenEndpoint"] = $"{_hostUrl}/connect/token",
            ["Registration:Address"] = "http://localhost:5011",
        });
        var client = remote.GetTestClient();

        await WaitUntilAsync(() => Task.FromResult(_calls.Any(c => c.Path == "/connect/token")));

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
    }

    private async Task RecordAsync(HttpContext context)
    {
        using var reader = new StreamReader(context.Request.Body);
        _calls.Enqueue((context.Request.Method, context.Request.Path, context.Request.Headers.Authorization.ToString(), await reader.ReadToEndAsync()));
    }

    private static async Task WaitUntilAsync(Func<Task<bool>> condition)
    {
        for (var attempt = 0; attempt < 100; attempt++)
        {
            if (await condition())
            {
                return;
            }

            await Task.Delay(100);
        }

        Assert.Fail("Condition not met within 10 s.");
    }
}
