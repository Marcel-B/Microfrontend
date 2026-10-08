namespace Mfe.ClientApp;

public static class ClientAppExtensions
{
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
        builder.Services.AddHostedService(services =>
            new DevServerLauncher(servers, contentRoot, services.GetRequiredService<ILoggerFactory>()));
        return builder;
    }
}
