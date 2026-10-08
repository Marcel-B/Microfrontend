using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Mfe.HostBff.Registry.Application;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Registry.Adapters.Http;

/// <summary>
/// Who may call the registry: remotes with their API key from "Registry:ApiKeys" in the X-Api-Key header, and
/// signed-in admins for the registry page. A key belongs to one remote id, so a remote can only register, renew and
/// deregister itself. The Identity server is not involved: in production it is not ours to configure.
/// </summary>
public static class RegistryAuthorization
{
    public const string Scheme = "Registry";

    public const string ApiKeyHeader = "X-Api-Key";

    public const string RemotePolicy = "registry-remote";

    public const string AdminPolicy = "registry-admin";

    /// <summary>Claim with the remote id the API key belongs to.</summary>
    public const string RemoteIdClaim = "remote_id";

    public static IServiceCollection AddRegistryAuthorization(this IServiceCollection services, IConfiguration configuration)
    {
        var registry = configuration.GetSection(RegistryOptions.SectionName).Get<RegistryOptions>() ?? new RegistryOptions();

        services.AddAuthentication().AddScheme<AuthenticationSchemeOptions, ApiKeyHandler>(Scheme, null);

        services.AddAuthorizationBuilder()
            .AddPolicy(RemotePolicy, policy => policy
                .AddAuthenticationSchemes(Scheme)
                .RequireClaim(RemoteIdClaim))
            .AddPolicy(AdminPolicy, policy => policy
                .AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme)
                .RequireClaim("role", registry.AdminRole));

        return services;
    }

    /// <summary>The remote id the caller's API key belongs to.</summary>
    public static string Owner(ClaimsPrincipal caller) => caller.FindFirstValue(RemoteIdClaim) ?? string.Empty;

    /// <summary>Finds the remote id of an API key. Compares hashes in constant time, so the answer time tells nothing about a key.</summary>
    internal static string? RemoteIdOf(string key, IReadOnlyDictionary<string, string> apiKeys)
    {
        var given = SHA256.HashData(Encoding.UTF8.GetBytes(key));
        string? match = null;
        foreach (var (remoteId, configured) in apiKeys)
        {
            if (!string.IsNullOrEmpty(configured)
                && CryptographicOperations.FixedTimeEquals(given, SHA256.HashData(Encoding.UTF8.GetBytes(configured))))
            {
                match ??= remoteId;
            }
        }

        return match;
    }

    private sealed class ApiKeyHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> schemeOptions,
        ILoggerFactory logger,
        UrlEncoder encoder,
        IOptionsMonitor<RegistryOptions> registry) : AuthenticationHandler<AuthenticationSchemeOptions>(schemeOptions, logger, encoder)
    {
        protected override Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue(ApiKeyHeader, out var values) || string.IsNullOrEmpty(values.ToString()))
            {
                return Task.FromResult(AuthenticateResult.NoResult());
            }

            if (RemoteIdOf(values.ToString(), registry.CurrentValue.ApiKeys) is not { } remoteId)
            {
                return Task.FromResult(AuthenticateResult.Fail("Unknown API key."));
            }

            var identity = new ClaimsIdentity([new Claim(RemoteIdClaim, remoteId)], RegistryAuthorization.Scheme);
            return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identity), RegistryAuthorization.Scheme)));
        }
    }
}
