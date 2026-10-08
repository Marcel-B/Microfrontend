using System.Text.RegularExpressions;

namespace Mfe.HostBff.Registry.Domain;

/// <summary>A reason the host refuses a registration. <see cref="Conflict"/> means another remote or the shell owns it.</summary>
public sealed record RegistrationProblem(string Field, string Message, bool Conflict = false);

/// <summary>What a registration must satisfy before the host routes to it and shows its pages.</summary>
public static partial class RegistrationRules
{
    /// <summary>Lower case, digits and dashes: it becomes a path segment of /remotes/{id}/ and /api/{id}/.</summary>
    [GeneratedRegex("^[a-z][a-z0-9-]{1,62}$")]
    private static partial Regex IdPattern();

    /// <summary>A JavaScript identifier: Module Federation uses it as the remote's global name.</summary>
    [GeneratedRegex("^[A-Za-z_$][A-Za-z0-9_$]*$")]
    private static partial Regex FederationNamePattern();

    [GeneratedRegex("^/[A-Za-z0-9._~/-]*$")]
    private static partial Regex PagePathPattern();

    /// <summary>Longer group names do not fit the navigation's heading.</summary>
    public const int MaxGroupLength = 40;

    /// <summary>Browsers cut tab titles long before this; it only keeps nonsense out.</summary>
    public const int MaxTabTitleLength = 200;

    public static bool IsValidId(string id) => IdPattern().IsMatch(id);

    /// <param name="registration">The registration to check.</param>
    /// <param name="others">All other registered remotes (not the one being renewed).</param>
    /// <param name="reservedPaths">Shell routes and path prefixes no remote may use, e.g. "/debug" or "/bff".</param>
    /// <param name="requiredLanguages">Languages every page title needs, e.g. "de" and "en".</param>
    /// <param name="reservedIds">Ids whose /remotes/{id}/ or /api/{id}/ the host already routes elsewhere.</param>
    public static List<RegistrationProblem> Check(
        RemoteRegistration registration,
        IEnumerable<RemoteRegistration> others,
        IReadOnlyCollection<string> reservedPaths,
        IReadOnlyCollection<string> requiredLanguages,
        IReadOnlyCollection<string> reservedIds)
    {
        var problems = new List<RegistrationProblem>();

        if (!IsValidId(registration.Id))
        {
            problems.Add(new("id", "Use 2 to 63 lower case letters, digits or dashes, starting with a letter."));
        }
        else if (reservedIds.Contains(registration.Id, StringComparer.OrdinalIgnoreCase))
        {
            problems.Add(new("id", $"The host already routes /remotes/{registration.Id}/ or /api/{registration.Id}/ elsewhere.", Conflict: true));
        }

        if (!FederationNamePattern().IsMatch(registration.FederationName))
        {
            problems.Add(new("federationName", "Must be a JavaScript identifier (the Module Federation name of the remote)."));
        }

        if (!registration.Address.IsAbsoluteUri || registration.Address.Scheme is not ("http" or "https"))
        {
            problems.Add(new("address", "Must be an absolute http or https URL."));
        }

        if (string.IsNullOrWhiteSpace(registration.Group))
        {
            problems.Add(new("group", "Every remote belongs to a navigation group; only the shell's start page has none."));
        }
        else if (registration.Group.Length > MaxGroupLength || registration.Group != registration.Group.Trim() || registration.Group.Any(char.IsControl))
        {
            problems.Add(new("group", $"Use at most {MaxGroupLength} characters without leading or trailing spaces."));
        }

        if (!registration.HealthPath.StartsWith('/'))
        {
            problems.Add(new("healthPath", "Must start with '/'."));
        }

        if (registration.Pages.Count == 0)
        {
            problems.Add(new("pages", "A remote needs at least one page."));
        }

        for (var i = 0; i < registration.Pages.Count; i++)
        {
            var page = registration.Pages[i];
            var field = $"pages[{i}]";

            if (!PagePathPattern().IsMatch(page.Path) || page.Path.Length < 2 || page.Path.EndsWith('/') || page.Path.Contains("//"))
            {
                problems.Add(new($"{field}.path", "Must start with '/', not end with '/' and contain only URL-safe characters."));
            }
            else if (reservedPaths.FirstOrDefault(reserved => Covers(reserved, page.Path)) is { } reserved)
            {
                problems.Add(new($"{field}.path", $"'{page.Path}' belongs to the shell ('{reserved}').", Conflict: true));
            }

            if (!page.Module.StartsWith("./", StringComparison.Ordinal))
            {
                problems.Add(new($"{field}.module", "Must be an exposed module, e.g. './DemoPage'."));
            }

            foreach (var language in requiredLanguages.Where(l => string.IsNullOrWhiteSpace(page.Title.GetValueOrDefault(l))))
            {
                problems.Add(new($"{field}.title.{language}", $"A title in '{language}' is required for the navigation."));
            }

            foreach (var (language, tabTitle) in page.TabTitle.Where(t => string.IsNullOrWhiteSpace(t.Value) || t.Value.Length > MaxTabTitleLength || t.Value.Any(char.IsControl)))
            {
                problems.Add(new($"{field}.tabTitle.{language}", $"Use 1 to {MaxTabTitleLength} characters without line breaks, or leave the language out."));
            }

            if (registration.Pages.Take(i).Any(p => SamePath(p.Path, page.Path)))
            {
                problems.Add(new($"{field}.path", $"'{page.Path}' is listed twice."));
            }
        }

        foreach (var other in others)
        {
            if (other.FederationName == registration.FederationName)
            {
                problems.Add(new("federationName", $"'{other.FederationName}' is already used by remote '{other.Id}'.", Conflict: true));
            }

            foreach (var page in registration.Pages.Where(p => other.Pages.Any(o => SamePath(o.Path, p.Path))))
            {
                problems.Add(new("pages", $"'{page.Path}' is already a page of remote '{other.Id}'.", Conflict: true));
            }
        }

        return problems;
    }

    /// <summary>"/debug" covers "/debug" and "/debug/registry"; "/" only covers "/" itself.</summary>
    private static bool Covers(string reserved, string path) =>
        SamePath(reserved, path)
        || (reserved != "/" && path.StartsWith(reserved.TrimEnd('/') + "/", StringComparison.OrdinalIgnoreCase));

    private static bool SamePath(string a, string b) => string.Equals(a, b, StringComparison.OrdinalIgnoreCase);
}
