using System.ComponentModel;
using Mfe.HostBff.Registry.Application;
using Mfe.HostBff.Registry.Domain;

namespace Mfe.HostBff.Registry.Adapters.Http;

// The HTTP contract of the registry. It maps to the domain in one place (ToDomain/From), so the domain can change
// without breaking remotes or the shell, and the other way round.

/// <summary>Body of PUT /registry/remotes/{id}: the registration and the heartbeat at the same time.</summary>
public sealed class RegisterRemoteRequest
{
    [Description("Module Federation name of the remote (the \"name\" in its vite.config), e.g. \"vueDemo\".")]
    public required string FederationName { get; init; }

    [Description("Address of the remote BFF as the host reaches it, e.g. \"http://localhost:5011\". The host forwards /remotes/{id}/ and /api/{id}/ there.")]
    public required string Address { get; init; }

    [Description("Version of the remote, shown on the registry page.")]
    public string? Version { get; init; }

    [Description("Name of the remote per language, shown on the registry page, e.g. { \"de\": \"Demo\", \"en\": \"Demo\" }.")]
    public Dictionary<string, string> DisplayName { get; init; } = [];

    [Description("API scope (token audience) the remote's API expects. The registry page warns when the host does not request it at login.")]
    public string? ApiScope { get; init; }

    [Description("Path the host checks for the remote's health, relative to its address.")]
    public string HealthPath { get; init; } = "/health";

    public List<RegisterPageRequest> Pages { get; init; } = [];

    public RemoteRegistration ToDomain(string id, Uri address) => new(
        id,
        FederationName,
        address,
        Version,
        DisplayName,
        string.IsNullOrWhiteSpace(ApiScope) ? null : ApiScope,
        HealthPath,
        [.. Pages.Select(p => p.ToDomain())]);
}

public sealed class RegisterPageRequest
{
    [Description("Route in the shell, e.g. \"/demo\".")]
    public required string Path { get; init; }

    [Description("Navigation entry and tab title per language, e.g. { \"de\": \"Klick-Demo\", \"en\": \"Click demo\" }.")]
    public Dictionary<string, string> Title { get; init; } = [];

    [Description("Exposed module of the remote with the page as default export, e.g. \"./DemoPage\".")]
    public required string Module { get; init; }

    [Description("Icon in the navigation: a PrimeIcons class in Vue (\"pi pi-star\"), a lucide icon name in React (\"star\").")]
    public string? Icon { get; init; }

    public bool RequiresAuth { get; init; }

    [Description("The user needs at least one of these roles to see the page. Implies requiresAuth.")]
    public List<string> Roles { get; init; } = [];

    public bool ShowInNav { get; init; } = true;

    [Description("Position in the navigation; lower comes first.")]
    public int Order { get; init; }

    public RemotePage ToDomain() => new(Path, Title, Module, Icon, RequiresAuth, Roles, ShowInNav, Order);
}

/// <summary>Answer to a registration or heartbeat. The remote takes its heartbeat interval from here.</summary>
public sealed record RegistrationResponse(
    string Id,
    RegistrationOutcome Outcome,
    RemoteHealth Health,
    string Entry,
    DateTimeOffset LeaseExpiresAt,
    int LeaseSeconds,
    int HeartbeatSeconds);

/// <summary>Response of GET /bff/remotes: the reachable remotes the shell loads.</summary>
public sealed record ShellRemotes(IReadOnlyList<ShellRemote> Remotes);

public sealed record ShellRemote(string Id, string Name, string Entry, string? Version, IReadOnlyList<ShellPage> Pages)
{
    public static ShellRemote From(RemoteRegistration registration) => new(
        registration.Id,
        registration.FederationName,
        registration.Entry,
        registration.Version,
        [.. registration.Pages.OrderBy(p => p.Order).Select(ShellPage.From)]);
}

public sealed record ShellPage(
    string Path,
    IReadOnlyDictionary<string, string> Title,
    string Module,
    string? Icon,
    bool RequiresAuth,
    IReadOnlyList<string> Roles,
    bool ShowInNav,
    int Order)
{
    public static ShellPage From(RemotePage page) =>
        new(page.Path, page.Title, page.Module, page.Icon, page.NeedsLogin, page.Roles, page.ShowInNav, page.Order);
}

/// <summary>Response of GET /bff/registry: everything the registry knows, for admins.</summary>
public sealed record RegistryView(
    DateTimeOffset At,
    RegistrySettingsView Settings,
    IReadOnlyList<RemoteView> Remotes,
    IReadOnlyList<FormerRemoteView> Former,
    IReadOnlyList<RegistryEvent> History);

public sealed record RegistrySettingsView(
    string Audience,
    int LeaseSeconds,
    int HeartbeatSeconds,
    int HealthCheckSeconds,
    int FailureThreshold,
    IReadOnlyList<string> RequestedScopes);

public sealed record RemoteView(
    string Id,
    string FederationName,
    IReadOnlyDictionary<string, string> DisplayName,
    string? Version,
    string Address,
    string Entry,
    string UiPath,
    string ApiPath,
    string? ApiScope,
    [property: Description("False when the host does not request the API scope at login: the remote's API would get tokens without its audience.")]
    bool ApiScopeRequested,
    string HealthUrl,
    RemoteHealth Health,
    string Owner,
    DateTimeOffset RegisteredAt,
    DateTimeOffset LastHeartbeatAt,
    DateTimeOffset LeaseExpiresAt,
    DateTimeOffset? LastCheckedAt,
    DateTimeOffset? LastHealthyAt,
    int ConsecutiveFailures,
    string? LastError,
    IReadOnlyList<ShellPage> Pages)
{
    public static RemoteView From(RegisteredRemote remote, IReadOnlyCollection<string> requestedScopes)
    {
        var r = remote.Registration;
        return new(
            r.Id, r.FederationName, r.DisplayName, r.Version, r.Address.ToString(), r.Entry, r.UiPath, r.ApiPath, r.ApiScope,
            r.ApiScope is null || requestedScopes.Contains(r.ApiScope),
            r.HealthUrl.ToString(), remote.Health, remote.Owner, remote.RegisteredAt, remote.LastHeartbeatAt,
            remote.LeaseExpiresAt, remote.LastCheckedAt, remote.LastHealthyAt, remote.ConsecutiveFailures, remote.LastError,
            [.. r.Pages.OrderBy(p => p.Order).Select(ShellPage.From)]);
    }
}

public sealed record FormerRemoteView(
    string Id,
    string FederationName,
    IReadOnlyDictionary<string, string> DisplayName,
    string? Version,
    string Address,
    string Owner,
    DateTimeOffset RegisteredAt,
    DateTimeOffset LeftAt,
    RegistryEventKind Reason,
    IReadOnlyList<ShellPage> Pages)
{
    public static FormerRemoteView From(FormerRemote former)
    {
        var r = former.Registration;
        return new(r.Id, r.FederationName, r.DisplayName, r.Version, r.Address.ToString(), former.Owner, former.RegisteredAt,
            former.LeftAt, former.Reason, [.. r.Pages.OrderBy(p => p.Order).Select(ShellPage.From)]);
    }
}
