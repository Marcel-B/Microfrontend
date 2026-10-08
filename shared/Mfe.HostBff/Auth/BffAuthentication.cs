using Mfe.HostBff.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;

namespace Mfe.HostBff.Auth;

public static class BffAuthentication
{
    /// <summary>Authentication property holding a per-session id. The logout URL must carry it (protects against CSRF logout).</summary>
    public const string SessionIdProperty = "bff_sid";

    public static IServiceCollection AddBffAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var oidc = configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>() ?? new OidcOptions();
        var session = configuration.GetSection(BffSessionOptions.SectionName).Get<BffSessionOptions>() ?? new BffSessionOptions();

        services.AddHttpClient(TokenRefresher.HttpClientName);
        services.AddSingleton<TokenRefresher>();

        services
            .AddAuthentication(options =>
            {
                options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                // Unauthenticated XHR/API calls get a 401 from the cookie handler. Only /bff/login challenges OIDC.
                options.DefaultChallengeScheme = CookieAuthenticationDefaults.AuthenticationScheme;
                options.DefaultSignOutScheme = OpenIdConnectDefaults.AuthenticationScheme;
            })
            .AddCookie(options =>
            {
                options.Cookie.Name = session.CookieName;
                options.Cookie.HttpOnly = true;
                options.Cookie.SameSite = SameSiteMode.Lax;
                options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
                options.ExpireTimeSpan = session.Lifetime;
                options.SlidingExpiration = true;

                options.Events.OnSigningIn = context =>
                {
                    context.Properties.Items[SessionIdProperty] = Guid.NewGuid().ToString("N");
                    return Task.CompletedTask;
                };
                options.Events.OnValidatePrincipal = context =>
                    context.HttpContext.RequestServices.GetRequiredService<TokenRefresher>().RefreshIfNeededAsync(context);

                // The SPA handles these status codes itself instead of following redirects.
                options.Events.OnRedirectToLogin = context => WriteStatus(context, StatusCodes.Status401Unauthorized);
                options.Events.OnRedirectToAccessDenied = context => WriteStatus(context, StatusCodes.Status403Forbidden);
            })
            .AddOpenIdConnect(options =>
            {
                options.Authority = oidc.Authority;
                options.ClientId = oidc.ClientId;
                options.ClientSecret = oidc.ClientSecret;
                options.RequireHttpsMetadata = oidc.RequireHttpsMetadata;

                options.ResponseType = OpenIdConnectResponseType.Code;
                options.UsePkce = true;
                options.SaveTokens = true;
                options.GetClaimsFromUserInfoEndpoint = false;
                options.MapInboundClaims = false;
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = "role";

                options.Scope.Clear();
                foreach (var scope in oidc.Scopes)
                {
                    options.Scope.Add(scope);
                }
            });

        services.AddAuthorization();

        return services;
    }

    private static Task WriteStatus(RedirectContext<CookieAuthenticationOptions> context, int statusCode)
    {
        context.Response.StatusCode = statusCode;
        return Task.CompletedTask;
    }
}
