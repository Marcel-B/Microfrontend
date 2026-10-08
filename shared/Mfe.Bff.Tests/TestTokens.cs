using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace Mfe.Bff.Tests;

/// <summary>Access tokens signed with a local key instead of the Identity server's, validated the same way otherwise.</summary>
internal static class TestTokens
{
    public const string Issuer = "http://identity.test/";

    private static readonly SymmetricSecurityKey SigningKey = new("a-signing-key-that-is-long-enough-for-hs256"u8.ToArray());

    public static string Create(string audience, Dictionary<string, object> claims) =>
        new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = Issuer,
            Audience = audience,
            Expires = DateTime.UtcNow.AddMinutes(5),
            Claims = claims,
            SigningCredentials = new SigningCredentials(SigningKey, SecurityAlgorithms.HmacSha256),
        });

    /// <summary>A client-credentials token of a remote's service client.</summary>
    public static string ForService(string clientId, string audience) => Create(audience, new() { ["sub"] = clientId });

    /// <summary>Makes the JWT bearer scheme trust the local key instead of reading the Identity server's discovery document.</summary>
    public static void TrustTestKey(this IServiceCollection services, string scheme)
    {
        services.PostConfigure<JwtBearerOptions>(scheme, options =>
        {
            var configuration = new OpenIdConnectConfiguration { Issuer = Issuer };
            configuration.SigningKeys.Add(SigningKey);
            options.Configuration = configuration;
            options.ConfigurationManager = new StaticConfigurationManager<OpenIdConnectConfiguration>(configuration);
        });
    }
}
