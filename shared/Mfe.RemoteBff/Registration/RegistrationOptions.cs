namespace Mfe.RemoteBff.Registration;

/// <summary>
/// How the remote registers at its host BFF. Bound from the "Registration" configuration section. Without
/// <see cref="HostUrl"/> the remote does not register (e.g. when it runs on its own).
/// </summary>
public sealed class RegistrationOptions
{
    public const string SectionName = "Registration";

    /// <summary>The host BFF, e.g. "http://localhost:5010". The remote calls PUT/DELETE {HostUrl}/registry/remotes/{id}.</summary>
    public string? HostUrl { get; set; }

    /// <summary>Address of this BFF as the host reaches it. Empty: the first address Kestrel listens on.</summary>
    public string? Address { get; set; }

    /// <summary>Identity server for the client-credentials token. Empty: "Jwt:Authority".</summary>
    public string? Authority { get; set; }

    /// <summary>Token endpoint. Empty: taken from the Identity server's discovery document.</summary>
    public string? TokenEndpoint { get; set; }

    public bool RequireHttpsMetadata { get; set; } = true;

    /// <summary>Service client of this remote at the Identity server, e.g. "mfe-vue-demo".</summary>
    public string ClientId { get; set; } = string.Empty;

    public string? ClientSecret { get; set; }

    /// <summary>Scope of the host's registry; becomes the token's audience, e.g. "vue-registry".</summary>
    public string Scope { get; set; } = string.Empty;

    /// <summary>Heartbeat interval until the host tells its own.</summary>
    public TimeSpan HeartbeatInterval { get; set; } = TimeSpan.FromSeconds(10);

    /// <summary>Time the remote gives its deregistration while shutting down.</summary>
    public TimeSpan DeregisterTimeout { get; set; } = TimeSpan.FromSeconds(3);

    public RemoteDescription Remote { get; set; } = new();
}

/// <summary>What the remote tells the host about itself: the body of PUT /registry/remotes/{id}.</summary>
public sealed class RemoteDescription
{
    /// <summary>Path segment of /remotes/{id}/ and /api/{id}/, e.g. "vue-demo". Must match "Ui:BasePath".</summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>Module Federation name, the "name" in the remote's vite.config.ts, e.g. "vueDemo".</summary>
    public string FederationName { get; set; } = string.Empty;

    /// <summary>Empty: the informational version of the entry assembly.</summary>
    public string? Version { get; set; }

    public Dictionary<string, string> DisplayName { get; set; } = [];

    /// <summary>Audience the remote's API expects. Empty: "Jwt:Audience".</summary>
    public string? ApiScope { get; set; }

    public string HealthPath { get; set; } = "/health";

    public List<PageDescription> Pages { get; set; } = [];
}

public sealed class PageDescription
{
    /// <summary>Route in the shell, e.g. "/demo".</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>Navigation entry and tab title per language.</summary>
    public Dictionary<string, string> Title { get; set; } = [];

    /// <summary>Exposed module with the page as default export, e.g. "./DemoPage".</summary>
    public string Module { get; set; } = string.Empty;

    /// <summary>PrimeIcons class in Vue ("pi pi-star"), lucide icon name in React ("star").</summary>
    public string? Icon { get; set; }

    public bool RequiresAuth { get; set; }

    public List<string> Roles { get; set; } = [];

    public bool ShowInNav { get; set; } = true;

    public int Order { get; set; }
}
