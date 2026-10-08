using System.Text.Json;
using System.Text.Json.Serialization;
using Mfe.ClientApp;
using Mfe.HostBff.Auth;
using Mfe.HostBff.Endpoints;
using Mfe.HostBff.Options;
using Mfe.HostBff.OpenApi;
using Mfe.HostBff.Proxy;
using Mfe.HostBff.Registry;
using Mfe.HostBff.Registry.Adapters.Http;
using Mfe.HostBff.Shell;

namespace Mfe.HostBff;

/// <summary>
/// Wires up a host BFF: login via OIDC with a cookie session, the /bff endpoints for the shell, the registry remotes
/// register with, a YARP proxy for remotes and their APIs (with the access token as bearer), OpenAPI with Swagger UI
/// and the shell itself. In Development it also starts the dev servers listed under "DevServers" (the shell in
/// ClientApp/, the component library).
/// </summary>
public static class HostBffExtensions
{
    public static WebApplicationBuilder AddHostBff(this WebApplicationBuilder builder)
    {
        builder.Services.AddBffAuthentication(builder.Configuration);
        builder.Services.AddBffProxy(builder.Configuration);
        builder.Services.AddRemoteRegistry(builder.Configuration);
        builder.Services.AddProblemDetails();
        builder.AddClientAppDevServers();
        builder.Services.AddHostOpenApi();
        builder.Services.ConfigureHttpJsonOptions(options =>
            options.SerializerOptions.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.CamelCase)));
        return builder;
    }

    public static WebApplication UseHostBff(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseMiddleware<CsrfHeaderMiddleware>();
        app.UseAuthorization();

        app.UseHostOpenApi();
        app.MapBffEndpoints();
        app.MapRegistryEndpoints();
        app.MapReverseProxy();
        app.MapShell();
        return app;
    }
}
