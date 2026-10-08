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
