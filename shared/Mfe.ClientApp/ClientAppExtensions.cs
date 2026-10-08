namespace Mfe.ClientApp;

public static class ClientAppExtensions
{
    /// <summary>
    /// Environment variable with the comma-separated origins of "DevCors:Origins", for the dev servers' vite.config.ts:
    /// a stage shell loading this remote's UI from the developer's machine needs CORS on the dev server too.
    /// </summary>
    public const string DevCorsOriginsVariable = "MFE_DEV_CORS_ORIGINS";

    /// <summary>
    /// In Development, starts the dev servers listed under "DevServers" together with the BFF (see
    /// <see cref="DevServerLauncher"/>). Elsewhere the BFF serves the built frontend from wwwroot.
    /// </summary>
    public static WebApplicationBuilder AddClientAppDevServers(this WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsDevelopment())
        {
            return builder;
        }

        var servers = builder.Configuration.GetSection(DevServerOptions.SectionName).Get<List<DevServerOptions>>() ?? [];
        if (servers.Count == 0)
        {
            return builder;
        }

        var contentRoot = builder.Environment.ContentRootPath;
        var corsOrigins = builder.Configuration.GetSection("DevCors:Origins").Get<List<string>>() ?? [];
        var environment = new Dictionary<string, string>();
        if (corsOrigins.Count > 0)
        {
            environment[DevCorsOriginsVariable] = string.Join(',', corsOrigins.Select(origin => origin.TrimEnd('/')));
        }

        builder.Services.AddHostedService(services =>
            new DevServerLauncher(servers, contentRoot, services.GetRequiredService<ILoggerFactory>()) { Environment = environment });
        return builder;
    }
}
