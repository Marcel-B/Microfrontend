namespace Mfe.HostBff.Options;

/// <summary>OpenID Connect settings of the host BFF. Bound from the "Oidc" configuration section.</summary>
public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Authority { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string? ClientSecret { get; set; }

    /// <summary>Scopes requested at login. API scopes (e.g. "vue-demo-api") become the audience of the access token.</summary>
    public List<string> Scopes { get; set; } = ["openid", "profile", "email", "roles", "offline_access"];

    public bool RequireHttpsMetadata { get; set; } = true;
}

/// <summary>Settings of the session cookie. Bound from the "Session" configuration section.</summary>
public sealed class BffSessionOptions
{
    public const string SectionName = "Session";

    /// <summary>
    /// Cookie name. Browsers do not separate cookies by port, so every host BFF on localhost needs its own name.
    /// </summary>
    public string CookieName { get; set; } = "mfe.session";

    public TimeSpan Lifetime { get; set; } = TimeSpan.FromHours(8);
}
