using System.Security.Claims;
using Mfe.HostBff.Auth;
using Mfe.HostBff.Options;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Endpoints;

public static class BffEndpoints
{
    public static IEndpointRouteBuilder MapBffEndpoints(this IEndpointRouteBuilder app)
    {
        var bff = app.MapGroup("/bff");

        bff.MapGet("/login", (string? returnUrl, HttpContext context) =>
            Results.Challenge(
                new AuthenticationProperties { RedirectUri = SafeReturnUrl(context, returnUrl) },
                [OpenIdConnectDefaults.AuthenticationScheme]));

        bff.MapGet("/logout", async (string? sid, string? returnUrl, HttpContext context) =>
        {
            var session = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!session.Succeeded)
            {
                return Results.Redirect(SafeReturnUrl(context, returnUrl));
            }

            if (sid is null || session.Properties?.GetString(BffAuthentication.SessionIdProperty) != sid)
            {
                return Results.BadRequest("Invalid session id.");
            }

            return Results.SignOut(
                new AuthenticationProperties { RedirectUri = SafeReturnUrl(context, returnUrl) },
                [CookieAuthenticationDefaults.AuthenticationScheme, OpenIdConnectDefaults.AuthenticationScheme]);
        });

        bff.MapGet("/user", async (HttpContext context) =>
        {
            var session = await context.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            if (!session.Succeeded || session.Principal is null)
            {
                return Results.Ok(BffUser.Anonymous);
            }

            var user = session.Principal;
            var sid = session.Properties?.GetString(BffAuthentication.SessionIdProperty);
            var expiresUtc = session.Properties?.ExpiresUtc;

            return Results.Ok(new BffUser(
                IsAuthenticated: true,
                Name: user.Identity?.Name ?? user.FindFirstValue("preferred_username") ?? user.FindFirstValue("sub"),
                Roles: [.. user.FindAll("role").Select(c => c.Value)],
                Claims: [.. user.Claims.Select(c => new BffClaim(c.Type, c.Value))],
                LogoutUrl: $"/bff/logout?sid={Uri.EscapeDataString(sid ?? string.Empty)}",
                SessionExpiresAt: expiresUtc));
        });

        bff.MapGet("/remotes", (IOptionsSnapshot<RemoteRegistry> registry) => Results.Ok(registry.Value));

        return app;
    }

    /// <summary>Only allows redirects back into this application (prevents open redirects).</summary>
    internal static string SafeReturnUrl(HttpContext context, string? returnUrl) =>
        !string.IsNullOrEmpty(returnUrl)
        && returnUrl.StartsWith('/')
        && !returnUrl.StartsWith("//", StringComparison.Ordinal)
        && !returnUrl.StartsWith("/\\", StringComparison.Ordinal)
            ? returnUrl
            : context.Request.PathBase.HasValue ? context.Request.PathBase.Value! : "/";
}

/// <summary>Response of GET /bff/remotes.</summary>
public sealed class RemoteRegistry
{
    public List<RemoteDefinition> Remotes { get; set; } = [];
}

public sealed record BffClaim(string Type, string Value);

public sealed record BffUser(
    bool IsAuthenticated,
    string? Name,
    IReadOnlyList<string> Roles,
    IReadOnlyList<BffClaim> Claims,
    string? LogoutUrl,
    DateTimeOffset? SessionExpiresAt)
{
    public static readonly BffUser Anonymous = new(false, null, [], [], null, null);
}
