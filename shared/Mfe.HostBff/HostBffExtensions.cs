using Mfe.ClientApp;
using Mfe.HostBff.Auth;
using Mfe.HostBff.Endpoints;
using Mfe.HostBff.Options;
using Mfe.HostBff.Proxy;
using Mfe.HostBff.Shell;

namespace Mfe.HostBff;

/// <summary>
/// Wires up a host BFF: login via OIDC with a cookie session, the /bff endpoints for the shell, a YARP proxy for
/// remotes and their APIs (with the access token as bearer) and the shell itself. In Development it also starts
/// the dev servers listed under "DevServers" (the shell in ClientApp/, the component library).
/// </summary>
public static class HostBffExtensions
{
    public static WebApplicationBuilder AddHostBff(this WebApplicationBuilder builder)
    {
        builder.Services.AddOptions<RemoteRegistry>().Bind(builder.Configuration);
        builder.Services.AddBffAuthentication(builder.Configuration);
        builder.Services.AddBffProxy(builder.Configuration);
        builder.Services.AddProblemDetails();
        builder.AddClientAppDevServers();
        return builder;
    }

    public static WebApplication UseHostBff(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseMiddleware<CsrfHeaderMiddleware>();
        app.UseAuthorization();

        app.MapBffEndpoints();
        app.MapReverseProxy();
        app.MapShell();
        return app;
    }
}
