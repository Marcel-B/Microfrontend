using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Reflection;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.Extensions.Options;

namespace Mfe.RemoteBff.Registration;

/// <summary>
/// Registers the remote at its host BFF once it accepts requests, repeats the registration as heartbeat in the interval
/// the host asks for, and deregisters when the remote shuts down. The host keeps registrations only in memory, so the
/// heartbeat also brings a restarted host back up to date. If the host is down the remote keeps trying.
/// </summary>
public sealed class HostRegistration(
    IHttpClientFactory httpClientFactory,
    ClientCredentialsTokens tokens,
    RegistrationState state,
    IOptions<RegistrationOptions> options,
    IHostApplicationLifetime lifetime,
    IServer server,
    TimeProvider time,
    ILogger<HostRegistration> logger) : BackgroundService
{
    public const string HttpClientName = "registration-host";

    private static readonly TimeSpan FirstRetry = TimeSpan.FromSeconds(1);

    private RegistrationOptions Settings => options.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (string.IsNullOrEmpty(Settings.HostUrl))
        {
            logger.LogInformation("Registration:HostUrl is not set, the remote does not register at a host");
            return;
        }

        // The host checks the remote's health right away, so register only once Kestrel accepts requests.
        if (!await StartedAsync(stoppingToken))
        {
            return;
        }

        var interval = Settings.HeartbeatInterval;
        var retry = FirstRetry;
        var failures = 0;

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var response = await RegisterAsync(stoppingToken);
                interval = TimeSpan.FromSeconds(Math.Max(1, response.HeartbeatSeconds));
                retry = FirstRetry;
                if (failures > 0 || response.Outcome == "registered")
                {
                    logger.LogInformation("Registered at host {Host} as {Id} ({Health})", Settings.HostUrl, response.Id, response.Health);
                }

                failures = 0;
                state.Succeeded(time.GetUtcNow(), response.Health);
                await Task.Delay(interval, time, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                failures++;
                state.Failed(exception.Message);
                // The first failure is worth a warning; a host that stays down would flood the log otherwise.
                logger.Log(failures == 1 ? LogLevel.Warning : LogLevel.Debug,
                    "Registration at host {Host} failed ({Failures}x): {Error}", Settings.HostUrl, failures, exception.Message);

                try
                {
                    await Task.Delay(retry, time, stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }

                retry = TimeSpan.FromTicks(Math.Min(retry.Ticks * 2, interval.Ticks));
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        await base.StopAsync(cancellationToken);

        if (!state.Current.IsRegistered)
        {
            return;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(Settings.DeregisterTimeout);
        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Delete, RegistrationUrl());
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", await tokens.GetAsync(timeout.Token));
            using var response = await httpClientFactory.CreateClient(HttpClientName).SendAsync(request, timeout.Token);
            state.Deregistered();
            logger.LogInformation("Deregistered from host {Host} ({Status})", Settings.HostUrl, (int)response.StatusCode);
        }
        catch (Exception exception)
        {
            // The lease runs out on the host anyway.
            logger.LogWarning("Deregistration at host {Host} failed: {Error}", Settings.HostUrl, exception.Message);
        }
    }

    private async Task<RegistrationResponse> RegisterAsync(CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient(HttpClientName);
        for (var attempt = 1; ; attempt++)
        {
            using var request = new HttpRequestMessage(HttpMethod.Put, RegistrationUrl()) { Content = JsonContent.Create(Body()) };
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", await tokens.GetAsync(cancellationToken));
            using var response = await client.SendAsync(request, cancellationToken);

            if (response.StatusCode == HttpStatusCode.Unauthorized && attempt == 1)
            {
                tokens.Forget();
                continue;
            }

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Host answered {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync(cancellationToken)}");
            }

            return (await response.Content.ReadFromJsonAsync<RegistrationResponse>(cancellationToken))!;
        }
    }

    private Uri RegistrationUrl() =>
        new($"{Settings.HostUrl!.TrimEnd('/')}/registry/remotes/{Uri.EscapeDataString(Settings.Remote.Id)}");

    private object Body()
    {
        var remote = Settings.Remote;
        return new
        {
            remote.FederationName,
            Address = Address(),
            Version = string.IsNullOrEmpty(remote.Version) ? EntryVersion() : remote.Version,
            remote.DisplayName,
            remote.ApiScope,
            remote.HealthPath,
            remote.Pages,
        };
    }

    private string Address()
    {
        if (!string.IsNullOrEmpty(Settings.Address))
        {
            return Settings.Address;
        }

        var listening = server.Features.Get<IServerAddressesFeature>()?.Addresses.FirstOrDefault()
            ?? throw new InvalidOperationException("Set Registration:Address: the server reports no address the host could reach.");
        // Kestrel bound to every interface reports "http://[::]:5011" or "http://+:5011"; the host needs a name.
        return listening.Replace("://[::]", "://localhost").Replace("://+", "://localhost").Replace("://*", "://localhost").Replace("://0.0.0.0", "://localhost");
    }

    private static string? EntryVersion()
    {
        var version = Assembly.GetEntryAssembly()?.GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion;
        return version?.Split('+')[0];
    }

    private async Task<bool> StartedAsync(CancellationToken stoppingToken)
    {
        var started = new TaskCompletionSource();
        using var onStarted = lifetime.ApplicationStarted.Register(() => started.TrySetResult());
        using var onStopping = stoppingToken.Register(() => started.TrySetCanceled());
        try
        {
            await started.Task;
            return true;
        }
        catch (OperationCanceledException)
        {
            return false;
        }
    }

    private sealed record RegistrationResponse(string Id, string Outcome, string Health, int HeartbeatSeconds);
}
