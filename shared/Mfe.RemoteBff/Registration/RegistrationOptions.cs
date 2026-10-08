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

    /// <summary>
    /// This remote's key at the host ("Registry:ApiKeys" there, under the remote's id), sent as X-Api-Key. Keep it out
    /// of the repository: user secrets or the environment variable Registration__ApiKey.
    /// </summary>
    public string? ApiKey { get; set; }

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

    /// <summary>Navigation group the remote's pages appear under in the shell, e.g. "Demo".</summary>
    public string Group { get; set; } = string.Empty;

    /// <summary>
    /// Browser tab title of every page, a template where "{title}" stands for the page's title in each language, e.g.
    /// "Test - {title}". It differs per stage, so it belongs in the BFF's .env (Registration__Remote__TabTitle) or the
    /// stage's environment, not in appsettings.json. Empty: the shell's own tab title.
    /// </summary>
    public string? TabTitle { get; set; }

    /// <summary>Audience the remote's API expects. Empty: "Jwt:Audience".</summary>
    public string? ApiScope { get; set; }

    public string HealthPath { get; set; } = "/health";

    public List<PageDescription> Pages { get; set; } = [];
}

public sealed class PageDescription
{
    /// <summary>Route in the shell, e.g. "/demo".</summary>
    public string Path { get; set; } = string.Empty;

    /// <summary>Navigation entry per language; also the "{title}" in the tab title.</summary>
    public Dictionary<string, string> Title { get; set; } = [];

    /// <summary>Exposed module with the page as default export, e.g. "./DemoPage".</summary>
    public string Module { get; set; } = string.Empty;

    /// <summary>PrimeIcons class in Vue ("pi pi-star"), lucide icon name in React ("star").</summary>
    public string? Icon { get; set; }

    public bool RequiresAuth { get; set; }

    public List<string> Roles { get; set; } = [];

    public bool ShowInNav { get; set; } = true;

    /// <summary>Position in the navigation group; lower comes first.</summary>
    public int Order { get; set; }

    /// <summary>Tab title of this page per language, overriding <see cref="RemoteDescription.TabTitle"/>; "{title}" works here too.</summary>
    public Dictionary<string, string> TabTitle { get; set; } = [];
}
