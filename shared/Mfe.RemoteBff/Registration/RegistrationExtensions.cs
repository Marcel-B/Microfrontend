using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace Mfe.RemoteBff.Registration;

public static class RegistrationExtensions
{
    /// <summary>Tag of health checks that only pass once the remote is registered at its host (/health/ready).</summary>
    public const string ReadyTag = "ready";

    public static IServiceCollection AddHostRegistration(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<RegistrationOptions>()
            .Bind(configuration.GetSection(RegistrationOptions.SectionName))
            .PostConfigure(options =>
            {
                // The remote already knows its Identity server and audience from token validation.
                options.Authority = string.IsNullOrEmpty(options.Authority) ? configuration["Jwt:Authority"] : options.Authority;
                options.Remote.ApiScope = string.IsNullOrEmpty(options.Remote.ApiScope) ? configuration["Jwt:Audience"] : options.Remote.ApiScope;
                if (configuration["Jwt:RequireHttpsMetadata"] is { } requireHttps && configuration[$"{RegistrationOptions.SectionName}:RequireHttpsMetadata"] is null)
                {
                    options.RequireHttpsMetadata = bool.Parse(requireHttps);
                }
            });

        services.TryAddSingleton(TimeProvider.System);
        services.AddHttpClient(ClientCredentialsTokens.HttpClientName);
        services.AddHttpClient(HostRegistration.HttpClientName);
        services.AddSingleton<ClientCredentialsTokens>();
        services.AddSingleton<RegistrationState>();
        services.AddHostedService<HostRegistration>();

        services.AddHealthChecks().AddCheck<RegistrationHealthCheck>("host-registration", tags: [ReadyTag]);
        return services;
    }
}

/// <summary>Ready means: the host knows this remote. Without a host (no Registration:HostUrl) the remote is ready at once.</summary>
internal sealed class RegistrationHealthCheck(RegistrationState state, IOptions<RegistrationOptions> options) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        var current = state.Current;
        return Task.FromResult(
            string.IsNullOrEmpty(options.Value.HostUrl) ? HealthCheckResult.Healthy("Not registering at a host.")
            : current.IsRegistered ? HealthCheckResult.Healthy($"Registered at {options.Value.HostUrl}, last heartbeat {current.LastHeartbeatAt:O}.")
            : HealthCheckResult.Unhealthy($"Not registered at {options.Value.HostUrl}: {current.LastError ?? "not tried yet"}"));
    }
}
