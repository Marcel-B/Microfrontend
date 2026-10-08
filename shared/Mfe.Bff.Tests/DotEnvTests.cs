using Mfe.RemoteBff;
using Mfe.RemoteBff.Registration;
using Microsoft.Extensions.Configuration;

namespace Mfe.Bff.Tests;

/// <summary>The remote BFF's .env: stage values such as the tab title, overridden by the stage's environment.</summary>
public sealed class DotEnvTests : IDisposable
{
    private readonly string _folder = Directory.CreateTempSubdirectory("mfe-dotenv-").FullName;

    public void Dispose() => Directory.Delete(_folder, recursive: true);

    [Fact]
    public void Parses_keys_like_environment_variables()
    {
        var values = DotEnv.Parse([
            "# Test-Stage",
            "",
            "Registration__Remote__TabTitle=Test - {title}",
            "export Registration__ApiKey = \"quoted value\" ",
            "Single='it''s'",
            "no separator",
            "=no key",
        ]);

        Assert.Equal("Test - {title}", values["Registration:Remote:TabTitle"]);
        Assert.Equal("quoted value", values["Registration:ApiKey"]);
        Assert.Equal("it''s", values["Single"]);
        Assert.Equal(3, values.Count);
    }

    [Fact]
    public void Overrides_appsettings_but_not_the_environment()
    {
        var variable = $"MfeDotEnvTest{Guid.NewGuid():N}";
        File.WriteAllLines(Path.Combine(_folder, DotEnv.FileName), [
            "Registration__Remote__TabTitle=Test - {title}",
            $"{variable}=from .env",
        ]);
        Environment.SetEnvironmentVariable(variable, "from the environment");
        try
        {
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Registration:Remote:TabTitle"] = "from appsettings",
                    [variable] = "from appsettings",
                })
                .AddEnvironmentVariables()
                .AddDotEnvFile(Path.Combine(_folder, DotEnv.FileName))
                .Build();

            Assert.Equal("Test - {title}", configuration["Registration:Remote:TabTitle"]);
            Assert.Equal("from the environment", configuration[variable]);
        }
        finally
        {
            Environment.SetEnvironmentVariable(variable, null);
        }
    }

    [Fact]
    public void A_missing_file_changes_nothing()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?> { ["Registration:Remote:TabTitle"] = "from appsettings" })
            .AddDotEnvFile(Path.Combine(_folder, DotEnv.FileName))
            .Build();

        Assert.Equal("from appsettings", configuration["Registration:Remote:TabTitle"]);
    }

    [Fact]
    public void Tab_titles_fill_the_template_per_language_and_pages_may_override_it()
    {
        var page = new PageDescription { Title = new() { ["de"] = "Klick-Demo", ["en"] = "Click demo" } };
        Assert.Equal(new Dictionary<string, string> { ["de"] = "Test - Klick-Demo", ["en"] = "Test - Click demo" },
            HostRegistration.TabTitles("Test - {title}", page));

        page.TabTitle = new() { ["en"] = "Test - Clicks" };
        Assert.Equal(new Dictionary<string, string> { ["de"] = "Test - Klick-Demo", ["en"] = "Test - Clicks" },
            HostRegistration.TabTitles("Test - {title}", page));

        Assert.Equal(new Dictionary<string, string> { ["en"] = "Test - Clicks" }, HostRegistration.TabTitles(null, page));
    }
}
