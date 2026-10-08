using System.Text.RegularExpressions;
using Mfe.HostBff.Registry.Adapters.Health;
using Mfe.HostBff.Registry.Adapters.Http;
using Mfe.HostBff.Registry.Adapters.Persistence;
using Mfe.HostBff.Registry.Adapters.Proxy;
using Mfe.HostBff.Registry.Application;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Yarp.ReverseProxy.Configuration;

namespace Mfe.HostBff.Registry;

/// <summary>
/// The remote registry, built as ports and adapters: Domain (registrations, rules, health), Application (use cases in
/// <see cref="RemoteRegistry"/> and the ports it needs), Adapters (HTTP endpoints, in-memory store, HTTP health probe,
/// YARP routes, the background worker). Only this class knows all of them.
/// </summary>
public static partial class RegistryExtensions
{
    public static IServiceCollection AddRemoteRegistry(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<RegistryOptions>()
            .Bind(configuration.GetSection(RegistryOptions.SectionName))
            .PostConfigure(options => options.ReservedIds.AddRange(StaticRouteIds(configuration)));
        services.TryAddSingleton(TimeProvider.System);

        services.AddSingleton<IRegistryStore, InMemoryRegistryStore>();
        services.AddHttpClient(HttpHealthProbe.HttpClientName);
        services.AddSingleton<IHealthProbe, HttpHealthProbe>();
        services.AddSingleton<YarpRemoteRoutes>();
        services.AddSingleton<IRemoteRoutes>(provider => provider.GetRequiredService<YarpRemoteRoutes>());
        // A second YARP configuration source next to "ReverseProxy" in appsettings.
        services.AddSingleton<IProxyConfigProvider>(provider => provider.GetRequiredService<YarpRemoteRoutes>().Provider);

        services.AddSingleton<RemoteRegistry>();
        services.AddHostedService<HealthCheckWorker>();
        services.AddRegistryAuthorization(configuration);
        return services;
    }

    /// <summary>Ids of /remotes/{id}/ and /api/{id}/ routes in the "ReverseProxy" configuration, e.g. "vue-components".</summary>
    internal static IEnumerable<string> StaticRouteIds(IConfiguration configuration) =>
        configuration.GetSection("ReverseProxy:Routes").GetChildren()
            .Select(route => route["Match:Path"])
            .Select(path => path is null ? null : StaticRoutePattern().Match(path))
            .Where(match => match is { Success: true })
            .Select(match => match!.Groups["id"].Value)
            .Distinct(StringComparer.OrdinalIgnoreCase);

    [GeneratedRegex("^/(remotes|api)/(?<id>[^/{]+)/", RegexOptions.IgnoreCase)]
    private static partial Regex StaticRoutePattern();
}
