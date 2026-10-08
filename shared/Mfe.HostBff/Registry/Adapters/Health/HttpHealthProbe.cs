using Mfe.HostBff.Registry.Application;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Registry.Adapters.Health;

/// <summary>A GET on the remote's health URL; any 2xx within the timeout counts as healthy.</summary>
public sealed class HttpHealthProbe(IHttpClientFactory httpClientFactory, IOptions<RegistryOptions> options) : IHealthProbe
{
    public const string HttpClientName = "registry-health";

    public async Task<HealthProbeResult> ProbeAsync(Uri healthUrl, CancellationToken cancellationToken)
    {
        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(options.Value.HealthCheckTimeout);

        try
        {
            using var response = await httpClientFactory.CreateClient(HttpClientName)
                .GetAsync(healthUrl, HttpCompletionOption.ResponseHeadersRead, timeout.Token);
            return response.IsSuccessStatusCode
                ? HealthProbeResult.Ok
                : HealthProbeResult.Failed($"HTTP {(int)response.StatusCode} from {healthUrl}");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthProbeResult.Failed($"No answer from {healthUrl} within {options.Value.HealthCheckTimeout.TotalSeconds:0.#} s");
        }
        catch (HttpRequestException exception)
        {
            return HealthProbeResult.Failed(exception.Message);
        }
    }
}
