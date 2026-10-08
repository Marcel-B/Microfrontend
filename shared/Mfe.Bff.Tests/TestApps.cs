using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.Configuration;

namespace Mfe.Bff.Tests;

/// <summary>Starts BFFs on an in-memory test server with a variant's appsettings.json plus overrides.</summary>
internal static class TestApps
{
    public static string VariantConfig(string name) => Path.Combine(AppContext.BaseDirectory, "variants", $"{name}.json");

    public static async Task<WebApplication> StartAsync(
        string variantConfig,
        Action<WebApplicationBuilder> configureServices,
        Action<WebApplication> configureApp,
        Dictionary<string, string?>? overrides = null)
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions
        {
            EnvironmentName = "Testing",
            ContentRootPath = AppContext.BaseDirectory,
        });
        builder.WebHost.UseTestServer();
        builder.Configuration.AddJsonFile(VariantConfig(variantConfig));
        // As in appsettings.Development.json: the Identity server runs on http://localhost.
        builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Oidc:RequireHttpsMetadata"] = "false",
            ["Jwt:RequireHttpsMetadata"] = "false",
        });
        builder.Configuration.AddInMemoryCollection(overrides ?? []);

        configureServices(builder);
        var app = builder.Build();
        configureApp(app);
        await app.StartAsync();
        return app;
    }
}
