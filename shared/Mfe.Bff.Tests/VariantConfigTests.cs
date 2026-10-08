using System.Text.Json;
using Mfe.HostBff.Registry;
using Microsoft.Extensions.Configuration;

namespace Mfe.Bff.Tests;

/// <summary>Checks that the BFFs of each variant are configured consistently with each other.</summary>
public sealed class VariantConfigTests
{
    public static TheoryData<string> Variants => new() { "vue", "react" };

    [Theory]
    [MemberData(nameof(Variants))]
    public void Demo_remote_registers_under_the_path_its_ui_is_served_at(string variant)
    {
        var demo = Load($"{variant}-demo");
        var id = demo.GetProperty("Registration").GetProperty("Remote").GetProperty("Id").GetString();

        Assert.Equal($"/remotes/{id}/", demo.GetProperty("Ui").GetProperty("BasePath").GetString());
        // The id must not collide with a static route of the host, e.g. the component library.
        Assert.DoesNotContain(id, RegistryExtensions.StaticRouteIds(Configuration($"{variant}-host")));
        Assert.Contains($"{variant}-components", RegistryExtensions.StaticRouteIds(Configuration($"{variant}-host")));
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Demo_remote_registers_with_the_api_key_its_host_has_for_it_in_development(string variant)
    {
        var id = Load($"{variant}-demo").GetProperty("Registration").GetProperty("Remote").GetProperty("Id").GetString()!;
        var key = Load($"{variant}-demo.Development").GetProperty("Registration").GetProperty("ApiKey").GetString();
        var hostKeys = Load($"{variant}-host.Development").GetProperty("Registry").GetProperty("ApiKeys");

        Assert.False(string.IsNullOrEmpty(key));
        Assert.Equal(hostKeys.GetProperty(id).GetString(), key);
        // Keys belong in user secrets or the environment outside development.
        Assert.False(Load($"{variant}-host").TryGetProperty("Registry", out var registry) && registry.TryGetProperty("ApiKeys", out _));
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Demo_remote_names_its_navigation_group(string variant)
    {
        var remote = Load($"{variant}-demo").GetProperty("Registration").GetProperty("Remote");

        Assert.False(string.IsNullOrWhiteSpace(remote.GetProperty("Group").GetString()));
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Every_page_has_a_german_and_an_english_title(string variant)
    {
        var pages = Load($"{variant}-demo").GetProperty("Registration").GetProperty("Remote").GetProperty("Pages").EnumerateArray();

        foreach (var page in pages)
        {
            var title = page.GetProperty("Title");
            Assert.False(string.IsNullOrWhiteSpace(title.GetProperty("de").GetString()));
            Assert.False(string.IsNullOrWhiteSpace(title.GetProperty("en").GetString()));
        }
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Host_bff_requests_the_scope_the_remote_bff_expects_as_audience(string variant)
    {
        var scopes = Load($"{variant}-host").GetProperty("Oidc").GetProperty("Scopes").EnumerateArray()
            .Select(s => s.GetString());
        var audience = Load($"{variant}-demo").GetProperty("Jwt").GetProperty("Audience").GetString();

        Assert.Contains(audience, scopes);
    }

    [Fact]
    public void Host_bffs_use_different_session_cookies()
    {
        // Cookies are not separated by port, so two BFFs on localhost would overwrite each other's session.
        string? Cookie(string name) => Load(name).GetProperty("Session").GetProperty("CookieName").GetString();

        Assert.NotEqual(Cookie("vue-host"), Cookie("react-host"));
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Host_bff_starts_the_shell_and_the_component_library_it_forwards_to(string variant)
    {
        var host = Load($"{variant}-host");
        var development = Load($"{variant}-host.Development");
        var started = DevServerOrigins(development);

        Assert.Contains(Origin(development.GetProperty("Shell").GetProperty("DevServer").GetString()!), started);
        var components = host.GetProperty("ReverseProxy").GetProperty("Clusters").GetProperty($"{variant}-components")
            .GetProperty("Destinations").EnumerateObject().Single().Value.GetProperty("Address").GetString()!;
        Assert.Contains(Origin(components), started);
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Remote_bff_starts_the_ui_it_forwards_to(string variant)
    {
        var development = Load($"{variant}-demo.Development");

        Assert.Contains(Origin(development.GetProperty("Ui").GetProperty("DevServer").GetString()!), DevServerOrigins(development));
    }

    private static List<string> DevServerOrigins(JsonElement development) =>
        [.. development.GetProperty("DevServers").EnumerateArray().Select(s => Origin(s.GetProperty("Url").GetString()!))];

    private static string Origin(string url) => new Uri(url).GetLeftPart(UriPartial.Authority);

    private static IConfiguration Configuration(string name) =>
        new ConfigurationBuilder().AddJsonFile(TestApps.VariantConfig(name)).Build();

    private static JsonElement Load(string name) =>
        JsonDocument.Parse(File.ReadAllText(TestApps.VariantConfig(name))).RootElement;
}
