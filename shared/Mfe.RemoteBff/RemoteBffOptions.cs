namespace Mfe.RemoteBff;

/// <summary>How the remote BFF validates access tokens. Bound from the "Jwt" configuration section.</summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    /// <summary>The Identity server, e.g. "http://localhost:5001". Signing keys come from its discovery document.</summary>
    public string Authority { get; set; } = string.Empty;

    /// <summary>Expected "aud" claim: the API scope the host BFF requests at login, e.g. "vue-demo-api".</summary>
    public string Audience { get; set; } = string.Empty;

    public bool RequireHttpsMetadata { get; set; } = true;
}

/// <summary>Where the remote's UI comes from. Bound from the "Ui" configuration section.</summary>
public sealed class UiOptions
{
    public const string SectionName = "Ui";

    /// <summary>Path the UI is served under. Must match the Vite "base" of the remote, e.g. "/remotes/vue-demo/".</summary>
    public string BasePath { get; set; } = "/";

    /// <summary>Vite dev server of the remote, e.g. "http://localhost:5174". When empty, the built files in <see cref="Root"/> are served.</summary>
    public string? DevServer { get; set; }

    /// <summary>Folder with the built UI (vite build output), relative to the content root.</summary>
    public string Root { get; set; } = "wwwroot";
}

/// <summary>
/// Origins of stage shells that may call this BFF's API from the browser. Bound from the "DevCors" configuration section,
/// and only meant for a remote BFF on a developer's machine whose UI a stage shell loads (the host BFF's DevOverrides):
/// the stage's shell then sends the API calls here itself, with the access token as bearer. Set it in the BFF's .env
/// (DevCors__Origins__0=https://shell.test.example), never on a stage. In Development the BFF hands the list to its
/// Vite dev server as MFE_DEV_CORS_ORIGINS, so the stage may load the UI's modules too.
/// </summary>
public sealed class DevCorsOptions
{
    public const string SectionName = "DevCors";

    public List<string> Origins { get; set; } = [];
}
