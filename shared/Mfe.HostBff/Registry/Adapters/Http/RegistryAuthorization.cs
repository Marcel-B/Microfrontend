using System.Security.Claims;
using Mfe.HostBff.Options;
using Mfe.HostBff.Registry.Application;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Mfe.HostBff.Registry.Adapters.Http;

/// <summary>
/// Who may call the registry: remotes with a client-credentials token of the Identity server whose audience is the
/// registry's (<see cref="RegistryOptions.Audience"/>), and signed-in admins for the registry page.
/// </summary>
public static class RegistryAuthorization
{
    public const string Scheme = "Registry";

    public const string RemotePolicy = "registry-remote";

    public const string AdminPolicy = "registry-admin";

    public static IServiceCollection AddRegistryAuthorization(this IServiceCollection services, IConfiguration configuration)
    {
        var oidc = configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>() ?? new OidcOptions();
        var registry = configuration.GetSection(RegistryOptions.SectionName).Get<RegistryOptions>() ?? new RegistryOptions();

        services.AddAuthentication().AddJwtBearer(Scheme, options =>
        {
            options.Authority = oidc.Authority;
            options.Audience = registry.Audience;
            options.RequireHttpsMetadata = oidc.RequireHttpsMetadata;
            options.MapInboundClaims = false;
        });

        services.AddAuthorizationBuilder()
            .AddPolicy(RemotePolicy, policy => policy
                .AddAuthenticationSchemes(Scheme)
                .RequireAuthenticatedUser()
                .RequireAssertion(context => Owner(context.User).Length > 0))
            .AddPolicy(AdminPolicy, policy => policy
                .AddAuthenticationSchemes(CookieAuthenticationDefaults.AuthenticationScheme)
                .RequireClaim("role", registry.AdminRole));

        return services;
    }

    /// <summary>The calling service: with client credentials the Identity server puts the client id into "sub".</summary>
    public static string Owner(ClaimsPrincipal caller) =>
        caller.FindFirstValue("sub") ?? caller.FindFirstValue("client_id") ?? string.Empty;
}
