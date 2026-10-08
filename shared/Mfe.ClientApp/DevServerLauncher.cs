using System.Diagnostics;

namespace Mfe.ClientApp;

/// <summary>
/// Starts the frontend dev servers listed under "DevServers" when the BFF starts and stops them with it, so a single
/// "dotnet run" brings up the BFF together with its frontend.
/// </summary>
/// <remarks>
/// YuE-UI does this with Microsoft.AspNetCore.SpaProxy. SpaProxy starts the dev server only when the browser asks for
/// the frontend's root URL and then redirects the browser to the dev server's port. Neither fits Module Federation:
/// the browser has to stay on the host BFF (session cookie, /bff, /api and /remotes on one origin), and the browser
/// never asks a remote BFF for its UI directly, only through the host BFF's proxy. So the BFF starts the dev server
/// itself and keeps forwarding to it (Shell:DevServer, Ui:DevServer).
/// </remarks>
public sealed class DevServerLauncher(
    IReadOnlyList<DevServerOptions> servers,
    string contentRoot,
    ILoggerFactory loggerFactory) : IHostedService, IDisposable
{
    /// <summary>A cold Vite start with Module Federation takes a few seconds; npm ci is not part of it.</summary>
    public TimeSpan StartTimeout { get; init; } = TimeSpan.FromSeconds(60);

    /// <summary>Environment variables for the dev servers this launcher starts (not for ones already running).</summary>
    public IReadOnlyDictionary<string, string> Environment { get; init; } = new Dictionary<string, string>();

    private readonly ILogger _logger = loggerFactory.CreateLogger<DevServerLauncher>();
    private readonly HttpClient _probe = new() { Timeout = TimeSpan.FromSeconds(2) };
    private readonly List<Process> _started = [];

    /// <summary>
    /// Waits until every dev server answers, so the BFF only starts listening once its frontend is there (and a
    /// readiness check against the BFF, as in Playwright, covers the frontend too).
    /// </summary>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        var waits = new List<Task>();
        foreach (var server in servers)
        {
            if (await IsRunningAsync(server.Url, cancellationToken))
            {
                _logger.LogInformation("Dev server {Name} is already running, the BFF forwards to it", server.Name);
                continue;
            }

            var process = Start(server);
            _started.Add(process);
            waits.Add(WaitUntilRunningAsync(server, process, cancellationToken));
        }

        await Task.WhenAll(waits);
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        foreach (var process in _started)
        {
            Stop(process);
        }

        return Task.CompletedTask;
    }

    public void Dispose()
    {
        foreach (var process in _started)
        {
            Stop(process);
            process.Dispose();
        }

        _started.Clear();
        _probe.Dispose();
    }

    private Process Start(DevServerOptions server)
    {
        var directory = Path.GetFullPath(Path.Combine(contentRoot, server.Directory));
        var startInfo = new ProcessStartInfo
        {
            FileName = OperatingSystem.IsWindows() ? "cmd.exe" : "/bin/sh",
            WorkingDirectory = directory,
            UseShellExecute = false,
            // Redirected so Vite neither clears the console nor reads keystrokes meant for dotnet.
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
        };
        startInfo.ArgumentList.Add(OperatingSystem.IsWindows() ? "/c" : "-c");
        startInfo.ArgumentList.Add(server.Command);
        foreach (var (name, value) in Environment)
        {
            startInfo.Environment[name] = value;
        }

        _logger.LogInformation("Starting dev server {Name} ({Command} in {Directory})", server.Name, server.Command, directory);
        var process = Process.Start(startInfo)
            ?? throw new InvalidOperationException($"Could not start dev server {server.Name}.");

        // Vite's own output ("Local: http://localhost:5173/", HMR updates) is Debug: the address to open is the
        // host BFF's, and Vite's port should not look like an alternative. Errors come on stderr and stay visible.
        // "Logging:LogLevel:Mfe.ClientApp": "Debug" shows everything.
        var output = loggerFactory.CreateLogger($"{typeof(DevServerLauncher).Namespace}.{server.Name}");
        process.OutputDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data)) output.LogDebug("{Line}", e.Data);
        };
        process.ErrorDataReceived += (_, e) =>
        {
            if (!string.IsNullOrWhiteSpace(e.Data)) output.LogWarning("{Line}", e.Data);
        };
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();
        return process;
    }

    private async Task WaitUntilRunningAsync(DevServerOptions server, Process process, CancellationToken cancellationToken)
    {
        var deadline = DateTime.UtcNow + StartTimeout;
        while (DateTime.UtcNow < deadline)
        {
            if (await IsRunningAsync(server.Url, cancellationToken))
            {
                _logger.LogInformation("Dev server {Name} is up, the BFF forwards to it", server.Name);
                return;
            }

            if (process.HasExited)
            {
                // Typically missing node_modules (run "npm ci" in the repository root) or a taken port (strictPort).
                _logger.LogError("Dev server {Name} exited with code {ExitCode} before answering on {Url}",
                    server.Name, process.ExitCode, server.Url);
                return;
            }

            await Task.Delay(TimeSpan.FromMilliseconds(250), cancellationToken);
        }

        _logger.LogWarning("Dev server {Name} did not answer on {Url} within {Timeout}; starting the BFF anyway",
            server.Name, server.Url, StartTimeout);
    }

    private async Task<bool> IsRunningAsync(string url, CancellationToken cancellationToken)
    {
        try
        {
            using var response = await _probe.GetAsync(url, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
            return true;
        }
        catch (HttpRequestException)
        {
            return false;
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return false;
        }
    }

    private void Stop(Process process)
    {
        try
        {
            // npm runs Vite in a child process; killing only the shell would leave Vite holding the port.
            if (!process.HasExited) process.Kill(entireProcessTree: true);
        }
        catch (InvalidOperationException)
        {
            // Exited in the meantime.
        }
        catch (Exception e) when (e is System.ComponentModel.Win32Exception or NotSupportedException)
        {
            _logger.LogWarning(e, "Could not stop dev server process {Id}", process.Id);
        }
    }
}
