namespace Mfe.HostBff.Registry.Application;

/// <summary>Settings of the remote registry. Bound from the "Registry" configuration section.</summary>
public sealed class RegistryOptions
{
    public const string SectionName = "Registry";

    /// <summary>
    /// API key per remote id, e.g. { "vue-demo": "..." }. A remote sends its key in the X-Api-Key header and may only
    /// register, renew and deregister that id. Keep the keys out of the repository (user secrets, environment variables
    /// such as Registry__ApiKeys__vue-demo).
    /// </summary>
    public Dictionary<string, string> ApiKeys { get; set; } = [];

    /// <summary>A registration is dropped when no heartbeat arrives for this long.</summary>
    public TimeSpan LeaseDuration { get; set; } = TimeSpan.FromSeconds(30);

    /// <summary>How often remotes should send their heartbeat. Told to them in every answer; well below the lease.</summary>
    public TimeSpan HeartbeatInterval { get; set; } = TimeSpan.FromSeconds(10);

    public TimeSpan HealthCheckInterval { get; set; } = TimeSpan.FromSeconds(10);

    public TimeSpan HealthCheckTimeout { get; set; } = TimeSpan.FromSeconds(3);

    /// <summary>Failed health checks in a row before a remote leaves the navigation.</summary>
    public int FailureThreshold { get; set; } = 2;

    /// <summary>Entries kept in the history and in the list of former remotes.</summary>
    public int HistorySize { get; set; } = 200;

    /// <summary>Role that may open the registry page and its API.</summary>
    public string AdminRole { get; set; } = "admin";

    /// <summary>Languages every page title needs, so the navigation never shows an empty entry.</summary>
    public List<string> RequiredLanguages { get; set; } = ["de", "en"];

    /// <summary>
    /// Paths remote pages may not use, because the shell or the BFF owns them. A path covers everything below it,
    /// except "/" which only covers the start page.
    /// </summary>
    public List<string> ReservedPaths { get; set; } =
        ["/", "/debug", "/login", "/401", "/403", "/bff", "/api", "/remotes", "/registry", "/swagger", "/openapi", "/signin-oidc", "/signout-callback-oidc"];

    /// <summary>
    /// Ids no remote may register, because a static route under "ReverseProxy" already uses /remotes/{id}/ or
    /// /api/{id}/ (e.g. the component library). Filled from that configuration; add more here if needed.
    /// </summary>
    public List<string> ReservedIds { get; set; } = [];
}
