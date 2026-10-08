using System.Net;
using System.Net.Sockets;
using Mfe.ClientApp;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace Mfe.Bff.Tests;

/// <summary>The launcher runs real processes; Node.js stands in for Vite.</summary>
public sealed class DevServerLauncherTests : IDisposable
{
    private readonly string _directory = Directory.CreateTempSubdirectory("mfe-devserver-").FullName;

    public void Dispose() => Directory.Delete(_directory, recursive: true);

    [Fact]
    public async Task Starts_the_dev_server_waits_until_it_answers_and_stops_it_with_the_bff()
    {
        var port = FreePort();
        var url = $"http://127.0.0.1:{port}/";
        using var launcher = Launcher(new DevServerOptions
        {
            Name = "fake-vite",
            Url = url,
            Directory = ".",
            Command = $"node -e \"require('http').createServer((q, s) => s.end('ok')).listen({port}, '127.0.0.1')\"",
        });
        using var client = new HttpClient();

        await launcher.StartAsync(CancellationToken.None);
        Assert.Equal("ok", await client.GetStringAsync(url));

        await launcher.StopAsync(CancellationToken.None);
        await Assert.ThrowsAsync<HttpRequestException>(() => WaitUntilGoneAsync(client, url));
    }

    [Fact]
    public async Task Uses_a_dev_server_that_already_runs_instead_of_starting_another()
    {
        await using var running = await StartFakeDevServerAsync();
        var url = running.Urls.Single();
        using var launcher = Launcher(new DevServerOptions
        {
            Name = "fake-vite",
            Url = url,
            Directory = ".",
            Command = "echo started > started.txt",
        });

        await launcher.StartAsync(CancellationToken.None);
        await launcher.StopAsync(CancellationToken.None);

        Assert.False(File.Exists(Path.Combine(_directory, "started.txt")));
    }

    [Fact]
    public async Task Does_not_wait_for_a_dev_server_that_exited()
    {
        using var launcher = Launcher(new DevServerOptions
        {
            Name = "broken",
            Url = $"http://127.0.0.1:{FreePort()}/",
            Directory = ".",
            Command = "exit 3",
        });

        var start = launcher.StartAsync(CancellationToken.None);

        Assert.Same(start, await Task.WhenAny(start, Task.Delay(TimeSpan.FromSeconds(10))));
    }

    private DevServerLauncher Launcher(DevServerOptions server) =>
        new([server], _directory, NullLoggerFactory.Instance) { StartTimeout = TimeSpan.FromSeconds(30) };

    private static async Task<WebApplication> StartFakeDevServerAsync()
    {
        var builder = WebApplication.CreateSlimBuilder();
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        var app = builder.Build();
        app.MapGet("/", () => Results.Text("vite"));
        await app.StartAsync();
        return app;
    }

    /// <summary>A killed process frees its port right away, but give the OS a moment.</summary>
    private static async Task WaitUntilGoneAsync(HttpClient client, string url)
    {
        for (var attempt = 0; attempt < 20; attempt++)
        {
            await client.GetStringAsync(url);
            await Task.Delay(100);
        }
    }

    private static int FreePort()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        return ((IPEndPoint)listener.LocalEndpoint).Port;
    }
}
