namespace Mfe.HostBff.Auth;

/// <summary>
/// Requires the custom header "X-CSRF: 1" on API and session endpoints. Browsers only send custom headers
/// cross-origin after a CORS preflight, which the BFF never allows, so cookie-authenticated requests from
/// foreign sites are rejected.
/// </summary>
public sealed class CsrfHeaderMiddleware(RequestDelegate next)
{
    public const string HeaderName = "X-CSRF";

    private static readonly PathString[] ProtectedPaths = ["/api", "/bff/user"];

    public Task InvokeAsync(HttpContext context)
    {
        if (ProtectedPaths.Any(p => context.Request.Path.StartsWithSegments(p))
            && context.Request.Headers[HeaderName] != "1")
        {
            context.Response.StatusCode = StatusCodes.Status400BadRequest;
            return context.Response.WriteAsync($"Missing {HeaderName} header.");
        }

        return next(context);
    }
}
