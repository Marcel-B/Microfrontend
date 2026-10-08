using Mfe.HostBff.Options;
using Microsoft.Extensions.FileProviders;

namespace Mfe.HostBff.Shell;

public static class ShellHosting
{
    /// <summary>
    /// Serves the shell for every path no other endpoint handles: from the Vite dev server when
    /// "Shell:DevServer" is set, otherwise from the built files with index.html as SPA fallback.
    /// </summary>
    public static WebApplication MapShell(this WebApplication app)
    {
        var options = app.Configuration.GetSection(ShellOptions.SectionName).Get<ShellOptions>() ?? new ShellOptions();

        if (!string.IsNullOrEmpty(options.DevServer))
        {
            // Lowest priority: /bff, /api and /remotes routes always win.
            app.MapForwarder("/{**catch-all}", options.DevServer).WithOrder(int.MaxValue);
            return app;
        }

        var root = Path.Combine(app.Environment.ContentRootPath, options.Root);
        if (!Directory.Exists(root))
        {
            app.Logger.LogWarning("Shell folder {Root} not found and no Shell:DevServer configured", root);
            return app;
        }

        var files = new PhysicalFileProvider(root);
        app.UseStaticFiles(new StaticFileOptions { FileProvider = files });
        app.MapFallbackToFile("index.html", new StaticFileOptions { FileProvider = files });
        return app;
    }
}
