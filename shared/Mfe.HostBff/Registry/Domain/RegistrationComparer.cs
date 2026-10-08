namespace Mfe.HostBff.Registry.Domain;

/// <summary>Value comparison of registrations. Records compare their dictionaries and lists by reference only.</summary>
internal static class RegistrationComparer
{
    public static bool Equal(RemoteRegistration a, RemoteRegistration b) =>
        a.Id == b.Id
        && a.FederationName == b.FederationName
        && a.Address == b.Address
        && a.Version == b.Version
        && a.Group == b.Group
        && a.ApiScope == b.ApiScope
        && a.HealthPath == b.HealthPath
        && SameTexts(a.DisplayName, b.DisplayName)
        && a.Pages.Count == b.Pages.Count
        && a.Pages.Zip(b.Pages).All(p => SamePage(p.First, p.Second));

    private static bool SamePage(RemotePage a, RemotePage b) =>
        a.Path == b.Path
        && a.Module == b.Module
        && a.Icon == b.Icon
        && a.RequiresAuth == b.RequiresAuth
        && a.ShowInNav == b.ShowInNav
        && a.Order == b.Order
        && a.Roles.SequenceEqual(b.Roles)
        && SameTexts(a.Title, b.Title)
        && SameTexts(a.TabTitle, b.TabTitle);

    private static bool SameTexts(IReadOnlyDictionary<string, string> a, IReadOnlyDictionary<string, string> b) =>
        a.Count == b.Count && a.All(entry => b.TryGetValue(entry.Key, out var value) && value == entry.Value);
}
