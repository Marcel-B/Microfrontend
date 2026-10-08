namespace Mfe.HostBff.Registry.Domain;

/// <summary>
/// What a remote tells the host about itself when it registers. The remote sends it again with every heartbeat, so
/// the host can rebuild its whole registry after a restart without keeping anything.
/// </summary>
public sealed record RemoteRegistration(
    string Id,
    string FederationName,
    Uri Address,
    string? Version,
    IReadOnlyDictionary<string, string> DisplayName,
    string Group,
    string? ApiScope,
    string HealthPath,
    IReadOnlyList<RemotePage> Pages)
{
    /// <summary>The host forwards /remotes/{Id}/ to the remote's UI; the remote's Vite "base" must match.</summary>
    public string UiPath => $"/remotes/{Id}/";

    /// <summary>The host forwards /api/{Id}/ to the remote's /api/ with the user's access token.</summary>
    public string ApiPath => $"/api/{Id}/";

    public string Entry => $"{UiPath}remoteEntry.js";

    public Uri HealthUrl => new(Address, HealthPath);

    /// <summary>Position of the remote in its navigation group: its first page.</summary>
    public int Order => Pages.Count == 0 ? 0 : Pages.Min(p => p.Order);
}

/// <summary>A page of a remote: a route in the shell and, if <see cref="ShowInNav"/>, an entry in its navigation.</summary>
public sealed record RemotePage(
    string Path,
    IReadOnlyDictionary<string, string> Title,
    string Module,
    string? Icon,
    bool RequiresAuth,
    IReadOnlyList<string> Roles,
    bool ShowInNav,
    int Order)
{
    /// <summary>Pages with roles need a login even when <see cref="RequiresAuth"/> is not set.</summary>
    public bool NeedsLogin => RequiresAuth || Roles.Count > 0;
}
