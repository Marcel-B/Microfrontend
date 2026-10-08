using System.Collections.Concurrent;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.TestHost;
using Mfe.RemoteBff.Registration;
using Microsoft.Extensions.DependencyInjection;

namespace Mfe.Bff.Tests;

/// <summary>A remote BFF registers at a fake host on a real socket with its API key, renews and deregisters.</summary>
public sealed class HostRegistrationTests : IAsyncLifetime
{
    private readonly ConcurrentQueue<(string Method, string Path, string? ApiKey, string Body)> _calls = new();
    private WebApplication _host = null!;
    private string _hostUrl = null!;

    public async Task InitializeAsync()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Testing" });
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        _host = builder.Build();
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
            ["Registration:Address"] = "http://localhost:5011",
            ["Registration:ApiKey"] = "key-of-vue-demo",
            ["Registration:Remote:TabTitle"] = "Test - {title}",
        });

        await WaitUntilAsync(async () => (await remote.GetTestClient().GetAsync("/health/ready")).StatusCode == HttpStatusCode.OK);
        await WaitUntilAsync(() => Task.FromResult(_calls.Count(c => c.Method == "PUT") >= 2));
        await remote.StopAsync();
        await remote.DisposeAsync();

        var put = _calls.First(c => c.Method == "PUT");
        Assert.Equal("/registry/remotes/vue-demo", put.Path);
        Assert.Equal("key-of-vue-demo", put.ApiKey);
        var body = JsonDocument.Parse(put.Body).RootElement;
        Assert.Equal("vueDemo", body.GetProperty("federationName").GetString());
        Assert.Equal("http://localhost:5011", body.GetProperty("address").GetString());
        Assert.Equal("vue-demo-api", body.GetProperty("apiScope").GetString());
        Assert.Equal("Demo", body.GetProperty("group").GetString());
        Assert.Equal(["/demo", "/admin"], body.GetProperty("pages").EnumerateArray().Select(p => p.GetProperty("path").GetString()));
        var tabTitle = body.GetProperty("pages")[0].GetProperty("tabTitle");
        Assert.Equal("Test - Klick-Demo", tabTitle.GetProperty("de").GetString());
        Assert.Equal("Test - Click demo", tabTitle.GetProperty("en").GetString());

        Assert.Equal("DELETE", _calls.Last().Method);
        Assert.Equal("/registry/remotes/vue-demo", _calls.Last().Path);
        Assert.Equal("key-of-vue-demo", _calls.Last().ApiKey);
    }

    [Fact]
    public async Task Is_not_ready_while_the_host_is_unreachable()
    {
        await using var remote = await RemoteBffTests.StartRemoteBffAsync(new()
        {
            ["Registration:HostUrl"] = "http://127.0.0.1:9",
            ["Registration:Address"] = "http://localhost:5011",
            ["Registration:ApiKey"] = "key-of-vue-demo",
        });
        var client = remote.GetTestClient();

        var state = remote.Services.GetRequiredService<RegistrationState>();

        await WaitUntilAsync(() => Task.FromResult(state.Current.LastError is not null));

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health")).StatusCode);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, (await client.GetAsync("/health/ready")).StatusCode);
    }

    private async Task RecordAsync(HttpContext context)
    {
        using var reader = new StreamReader(context.Request.Body);
        _calls.Enqueue((context.Request.Method, context.Request.Path, context.Request.Headers["X-Api-Key"].ToString(), await reader.ReadToEndAsync()));
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
