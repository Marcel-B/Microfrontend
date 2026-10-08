using Mfe.ClientApp;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.FileProviders;

namespace Mfe.RemoteBff;

/// <summary>
/// Wires up a remote BFF. It sits behind a host BFF, which forwards two kinds of requests:
/// the remote's UI (remoteEntry.js and its chunks) and calls to the remote's API under /api with the user's
/// access token as bearer token. The remote BFF never sees the session cookie.
/// </summary>
public static class RemoteBffExtensions
{
    public static WebApplicationBuilder AddRemoteBff(this WebApplicationBuilder builder)
    {
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
        builder.Services.AddHttpForwarder();
        builder.Services.AddProblemDetails();
        // In Development: the remote's own Vite dev server (ClientApp/), listed under "DevServers".
        builder.AddClientAppDevServers();
        return builder;
    }

    public static WebApplication UseRemoteBff(this WebApplication app)
    {
        app.UseAuthentication();
        app.UseAuthorization();
        return app;
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
            app.MapForwarder($"{basePath.TrimEnd('/')}/{{**catch-all}}", options.DevServer);
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
