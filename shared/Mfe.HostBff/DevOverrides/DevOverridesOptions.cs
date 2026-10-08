namespace Mfe.HostBff.DevOverrides;

/// <summary>
/// Lets developers load a remote running on their own machine into this shell, for their own browser only. Bound from
/// the "DevOverrides" configuration section. Off by default; turn it on for development and test stages, never in
/// production (the stage's environment variable DevOverrides__Enabled=true).
/// </summary>
/// <remarks>
/// The shell keeps a developer's overrides in localStorage and only applies them while this is on: the remote's UI from
/// a loopback address instead of /remotes/{id}/, and optionally its API calls (/api/{id}/) sent to a remote BFF on the
/// developer's machine with the access token from GET /bff/dev/token. Other users of the stage see nothing of it.
/// </remarks>
public sealed class DevOverridesOptions
{
    public const string SectionName = "DevOverrides";

    public bool Enabled { get; set; }
}
