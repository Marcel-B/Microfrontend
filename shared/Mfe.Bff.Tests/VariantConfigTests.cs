using System.Text.Json;

namespace Mfe.Bff.Tests;

/// <summary>Checks that the BFFs of each variant are configured consistently with each other.</summary>
public sealed class VariantConfigTests
{
    public static TheoryData<string> Variants => new() { "vue", "react" };

    [Theory]
    [MemberData(nameof(Variants))]
    public void Every_remote_entry_is_routed_by_the_host_bff(string variant)
    {
        var host = Load($"{variant}-host");
        var routes = host.GetProperty("ReverseProxy").GetProperty("Routes").EnumerateObject()
            .Select(r => r.Value.GetProperty("Match").GetProperty("Path").GetString()!.Replace("{**catch-all}", ""))
            .ToList();

        foreach (var remote in host.GetProperty("Remotes").EnumerateArray())
        {
            var entry = remote.GetProperty("Entry").GetString()!;
            Assert.Contains(routes, prefix => entry.StartsWith(prefix, StringComparison.Ordinal));
        }

        Assert.Contains($"/remotes/{variant}-components/", routes);
    }

    [Theory]
    [MemberData(nameof(Variants))]
    public void Every_page_has_a_german_and_an_english_title(string variant)
    {
        var pages = Load($"{variant}-host").GetProperty("Remotes").EnumerateArray()
            .SelectMany(r => r.GetProperty("Pages").EnumerateArray());

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

    private static JsonElement Load(string name) =>
        JsonDocument.Parse(File.ReadAllText(TestApps.VariantConfig(name))).RootElement;
}
