namespace Mfe.Bff.Options;

/// <summary>OpenID Connect settings of the BFF. Bound from the "Oidc" configuration section.</summary>
public sealed class OidcOptions
{
    public const string SectionName = "Oidc";

    public string Authority { get; set; } = string.Empty;

    public string ClientId { get; set; } = string.Empty;

    public string? ClientSecret { get; set; }

    public List<string> Scopes { get; set; } = ["openid", "profile", "email", "roles", "offline_access"];

    public bool RequireHttpsMetadata { get; set; } = true;
}
