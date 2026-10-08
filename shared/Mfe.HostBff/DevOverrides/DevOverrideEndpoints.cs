using System.Globalization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.DevOverrides;

public static class DevOverrideEndpoints
{
    public static IServiceCollection AddDevOverrides(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddOptions<DevOverridesOptions>().Bind(configuration.GetSection(DevOverridesOptions.SectionName));
        return services;
    }

    public static IEndpointRouteBuilder MapDevOverrideEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapGet("/bff/dev/token", GetTokenAsync)
            .WithTags("Shell")
            .WithSummary("The session's access token, for API calls to a remote BFF on the developer's machine (DevOverrides only)")
            .WithDescription(
                "Only answers while DevOverrides:Enabled is set; 404 otherwise. Needs the session cookie and the X-CSRF " +
                "header, so only the shell's own scripts can read it.");
        return app;
    }

    /// <summary>
    /// A BFF never hands its tokens to the browser; this is the one exception, and only on stages that allow overrides.
    /// A remote BFF on the developer's machine cannot get the session cookie, and the stage cannot reach that machine
    /// to forward to it, so the shell sends the developer's own token there itself.
    /// </summary>
    private static async Task<Results<Ok<DevToken>, UnauthorizedHttpResult, NotFound>> GetTokenAsync(
        HttpContext context,
        IOptionsMonitor<DevOverridesOptions> options)
    {
        if (!options.CurrentValue.Enabled)
        {
            return TypedResults.NotFound();
        }

        // Authenticating the cookie also renews a token that is about to expire (TokenRefresher).
        var session = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        var token = session.Succeeded ? session.Properties?.GetTokenValue("access_token") : null;
        if (token is null)
        {
            return TypedResults.Unauthorized();
        }

        var expiresAt = DateTimeOffset.TryParse(session.Properties!.GetTokenValue("expires_at"), CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed) ? parsed : (DateTimeOffset?)null;
        context.Response.Headers.CacheControl = "no-store";
        return TypedResults.Ok(new DevToken(token, expiresAt));
    }
}

/// <summary>Response of GET /bff/dev/token.</summary>
public sealed record DevToken(string AccessToken, DateTimeOffset? ExpiresAt);
