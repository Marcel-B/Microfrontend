using Mfe.ClientApp;
using Mfe.RemoteBff.Registration;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;
using Yarp.ReverseProxy.Transforms;

namespace Mfe.RemoteBff;

/// <summary>
/// Wires up a remote BFF. It sits behind a host BFF, which forwards two kinds of requests:
/// the remote's UI (remoteEntry.js and its chunks) and calls to the remote's API under /api with the user's
/// access token as bearer token. The remote BFF never sees the session cookie. It registers itself at the host
/// ("Registration"), so the host knows its pages and where to forward them, and answers the host's health checks.
/// </summary>
public static class RemoteBffExtensions
{
    public static WebApplicationBuilder AddRemoteBff(this WebApplicationBuilder builder)
    {
        // Stage-dependent values such as the tab title, between appsettings and the stage's environment variables.
        builder.Configuration.AddDotEnvFile(Path.Combine(builder.Environment.ContentRootPath, DotEnv.FileName));
        var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        builder.Services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.Authority = jwt.Authority;
                options.Audience = jwt.Audience;
                options.RequireHttpsMetadata = jwt.RequireHttpsMetadata;
                options.MapInboundClaims = false;
                options.TokenValidationParameters.NameClaimType = "name";
                options.TokenValidationParameters.RoleClaimType = "role";
            });

        builder.Services.AddAuthorization();
        builder.Services.AddDevCors(builder.Configuration);
        builder.Services.AddHttpForwarder();
        builder.Services.AddProblemDetails();
        builder.Services.AddHostRegistration(builder.Configuration);
        // In Development: the remote's own Vite dev server (ClientApp/), listed under "DevServers".
        builder.AddClientAppDevServers();
        return builder;
    }

    public static WebApplication UseRemoteBff(this WebApplication app)
    {
        // Before authentication: a preflight carries no token and must not end as 401.
        app.UseCors();
        app.UseAuthentication();
        app.UseAuthorization();

        // /health: the BFF is up (the host's health check). /health/ready: also registered at the host.
        app.MapHealthChecks("/health", new HealthCheckOptions { Predicate = check => !check.Tags.Contains(RegistrationExtensions.ReadyTag) });
        app.MapHealthChecks("/health/ready");
        return app;
    }

    /// <summary>
    /// CORS for the stage shells listed under "DevCors:Origins" (see <see cref="DevCorsOptions"/>). Without origins there
    /// is no policy, so a BFF behind its host never allows cross-origin requests.
    /// </summary>
    private static IServiceCollection AddDevCors(this IServiceCollection services, IConfiguration configuration)
    {
        var origins = (configuration.GetSection(DevCorsOptions.SectionName).Get<DevCorsOptions>() ?? new DevCorsOptions()).Origins
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.TrimEnd('/'))
            .ToArray();

        services.AddCors(options =>
        {
            if (origins.Length == 0)
            {
                return;
            }

            options.AddDefaultPolicy(policy => policy
                .WithOrigins(origins)
                // Any header, since a remote's HTTP client may add its own (correlation ids, X-CSRF); only the listed shells
                // get this far. The bearer token replaces the cookie, so no credentials.
                .AllowAnyHeader()
                .AllowAnyMethod());
        });
        return services;
    }

    /// <summary>
    /// Serves the remote's UI under "Ui:BasePath": from the Vite dev server when "Ui:DevServer" is set,
    /// otherwise from the built files.
    /// </summary>
    public static WebApplication MapRemoteUi(this WebApplication app)
    {
        var options = app.Configuration.GetSection(UiOptions.SectionName).Get<UiOptions>() ?? new UiOptions();
        var basePath = "/" + options.BasePath.Trim('/');

        if (!string.IsNullOrEmpty(options.DevServer))
        {
            // The host BFF already drops cookies; this covers the remote BFF's own port opened in the browser, which
            // would hand Vite every localhost cookie (431 above Node's 16 KB header limit).
            app.MapForwarder($"{basePath.TrimEnd('/')}/{{**catch-all}}", options.DevServer,
                transforms => transforms.AddRequestHeaderRemove("Cookie"));
            return app;
        }

        var root = Path.Combine(app.Environment.ContentRootPath, options.Root);
        if (!Directory.Exists(root))
        {
            app.Logger.LogWarning("UI folder {Root} not found and no Ui:DevServer configured", root);
            return app;
        }

        app.UseStaticFiles(new StaticFileOptions
        {
            FileProvider = new PhysicalFileProvider(root),
            RequestPath = basePath == "/" ? PathString.Empty : basePath,
        });
        return app;
    }
}
