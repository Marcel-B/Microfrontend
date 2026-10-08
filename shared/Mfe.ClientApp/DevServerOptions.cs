namespace Mfe.ClientApp;

/// <summary>
/// A frontend dev server the BFF starts with "dotnet run". Bound from the "DevServers" list in
/// appsettings.Development.json; only read in the Development environment.
/// </summary>
public sealed class DevServerOptions
{
    public const string SectionName = "DevServers";

    /// <summary>Shown in the log, e.g. "shell".</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>
    /// Address the dev server answers on, e.g. "http://localhost:5173/". Any HTTP answer counts as running, so a dev
    /// server started by hand (or by another BFF) is used instead of starting a second one on the same port.
    /// </summary>
    public string Url { get; set; } = string.Empty;

    /// <summary>Folder the command runs in, relative to the content root, e.g. "ClientApp".</summary>
    public string Directory { get; set; } = "ClientApp";

    /// <summary>Shell command that starts the dev server.</summary>
    public string Command { get; set; } = "npm run dev";
}
