using Mfe.HostBff.Registry.Application;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Registry.Adapters.Health;

/// <summary>Drives the registry's housekeeping: expired leases and health checks every <see cref="RegistryOptions.HealthCheckInterval"/>.</summary>
public sealed class HealthCheckWorker(
    RemoteRegistry registry,
    IOptions<RegistryOptions> options,
    TimeProvider time,
    ILogger<HealthCheckWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(options.Value.HealthCheckInterval, time);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await registry.CheckAllAsync(stoppingToken);
                }
                catch (Exception exception) when (exception is not OperationCanceledException)
                {
                    logger.LogError(exception, "Health check round failed");
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }
}
