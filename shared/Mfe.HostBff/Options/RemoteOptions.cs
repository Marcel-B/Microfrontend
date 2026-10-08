namespace Mfe.HostBff.Options;

/// <summary>
/// The remotes (pages) the shell loads at runtime via Module Federation. Bound from the "Remotes" configuration
/// section and served to the shell by GET /bff/remotes.
/// </summary>
public sealed class RemoteDefinition
{
    public const string SectionName = "Remotes";

    /// <summary>Module Federation name of the remote (the "name" in its vite.config).</summary>
    public required string Name { get; set; }

    /// <summary>URL of the remote's remoteEntry.js, absolute or relative to the BFF origin.</summary>
    public required string Entry { get; set; }

    public List<RemotePage> Pages { get; set; } = [];
}

public sealed class RemotePage
{
    /// <summary>Route path inside the shell, e.g. "/demo".</summary>
    public required string Path { get; set; }

    /// <summary>Title per language, e.g. { "de": "Klick-Demo", "en": "Click demo" }. Used for navigation and tab title.</summary>
    public Dictionary<string, string> Title { get; set; } = [];

    /// <summary>Exposed module of the remote, e.g. "./DemoPage".</summary>
    public required string Module { get; set; }

    /// <summary>Icon hint for the navigation (PrimeIcons class in Vue, lucide icon name in React).</summary>
    public string? Icon { get; set; }

    public bool RequiresAuth { get; set; }

    /// <summary>The user needs at least one of these roles. Implies <see cref="RequiresAuth"/>.</summary>
    public List<string> Roles { get; set; } = [];

    public bool ShowInNav { get; set; } = true;
}

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
