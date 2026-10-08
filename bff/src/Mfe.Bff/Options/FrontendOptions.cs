namespace Mfe.Bff.Options;

/// <summary>
/// The UI variants (shells) served by the BFF and the remotes (pages) each shell loads at runtime.
/// Bound from the "Frontends" configuration section.
/// </summary>
public sealed class FrontendOptions
{
    public const string SectionName = "Frontends";

    /// <summary>Variant the root URL redirects to.</summary>
    public string Default { get; set; } = "vue";

    public Dictionary<string, FrontendVariant> Variants { get; set; } = new(StringComparer.OrdinalIgnoreCase);
}

public sealed class FrontendVariant
{
    /// <summary>Path the shell is served under, e.g. "/vue/". Must match the Vite "base" of the host app.</summary>
    public string BasePath { get; set; } = "/";

    public List<RemoteDefinition> Remotes { get; set; } = [];
}

public sealed class RemoteDefinition
{
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

    public required string Title { get; set; }

    /// <summary>Exposed module of the remote, e.g. "./DemoPage".</summary>
    public required string Module { get; set; }

    /// <summary>Icon hint for the navigation (PrimeIcons class in Vue, lucide icon name in React).</summary>
    public string? Icon { get; set; }

    public bool RequiresAuth { get; set; }

    /// <summary>The user needs at least one of these roles. Implies <see cref="RequiresAuth"/>.</summary>
    public List<string> Roles { get; set; } = [];

    public bool ShowInNav { get; set; } = true;
}
