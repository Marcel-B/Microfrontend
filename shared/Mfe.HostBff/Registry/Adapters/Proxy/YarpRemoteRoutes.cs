using Mfe.HostBff.Proxy;
using Mfe.HostBff.Registry.Application;
using Mfe.HostBff.Registry.Domain;
using Yarp.ReverseProxy.Configuration;

namespace Mfe.HostBff.Registry.Adapters.Proxy;

/// <summary>
/// A YARP configuration source next to "ReverseProxy" in appsettings: per registered remote a route for its UI
/// (/remotes/{id}/) and one for its API (/api/{id}/ → /api/, login required, access token as bearer). The global
/// transforms of <see cref="BffProxy"/> apply to these routes too, so the session cookie never leaves the host.
/// </summary>
public sealed class YarpRemoteRoutes : IRemoteRoutes
{
    public const string RoutePrefix = "registry-";

    public InMemoryConfigProvider Provider { get; } = new([], [], "registry");

    public void Update(IReadOnlyList<RemoteRegistration> remotes)
    {
        var routes = remotes.SelectMany(remote => new[]
        {
            new RouteConfig
            {
                RouteId = $"{RoutePrefix}{remote.Id}-ui",
                ClusterId = Cluster(remote),
                Match = new RouteMatch { Path = $"{remote.UiPath}{{**catch-all}}" },
            },
            new RouteConfig
            {
                RouteId = $"{RoutePrefix}{remote.Id}-api",
                ClusterId = Cluster(remote),
                AuthorizationPolicy = "default",
                Match = new RouteMatch { Path = $"{remote.ApiPath}{{**catch-all}}" },
                Transforms = [new Dictionary<string, string> { ["PathPattern"] = "/api/{**catch-all}" }],
                Metadata = new Dictionary<string, string> { [BffProxy.AccessTokenMetadata] = "true" },
            },
        }).ToList();

        var clusters = remotes.Select(remote => new ClusterConfig
        {
            ClusterId = Cluster(remote),
            Destinations = new Dictionary<string, DestinationConfig>
            {
                ["remote-bff"] = new() { Address = remote.Address.ToString() },
            },
        }).ToList();

        Provider.Update(routes, clusters);
    }

    private static string Cluster(RemoteRegistration remote) => $"{RoutePrefix}{remote.Id}";
}
