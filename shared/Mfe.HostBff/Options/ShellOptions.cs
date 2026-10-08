namespace Mfe.HostBff.Options;

/// <summary>Where the shell comes from. Bound from the "Shell" configuration section.</summary>
public sealed class ShellOptions
{
    public const string SectionName = "Shell";

    /// <summary>
    /// Vite dev server of the shell, e.g. "http://localhost:5173". When empty, the BFF serves the built shell
    /// from <see cref="Root"/> and falls back to index.html for client-side routes.
    /// </summary>
    public string? DevServer { get; set; }

    /// <summary>Folder with the built shell (vite build output), relative to the content root.</summary>
    public string Root { get; set; } = "wwwroot";
}
