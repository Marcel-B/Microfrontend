using Microsoft.Extensions.Configuration.EnvironmentVariables;

namespace Mfe.RemoteBff;

/// <summary>
/// Reads a .env file next to the BFF into the configuration, for values that differ per stage (e.g. the tab title
/// "Test - {title}"). Keys follow the environment variable convention, "Registration__Remote__TabTitle". The file sits
/// between appsettings and the environment: it overrides appsettings.json, real environment variables of the stage
/// override it. It is optional and never checked in (.env.example shows what it may contain).
/// </summary>
public static class DotEnv
{
    public const string FileName = ".env";

    public static IConfigurationBuilder AddDotEnvFile(this IConfigurationBuilder builder, string path)
    {
        var source = new DotEnvConfigurationSource(path);
        // Environment variables win: insert before the last unprefixed environment source, else append.
        var index = -1;
        for (var i = 0; i < builder.Sources.Count; i++)
        {
            if (builder.Sources[i] is EnvironmentVariablesConfigurationSource { Prefix: null or "" })
            {
                index = i;
            }
        }

        if (index < 0)
        {
            builder.Sources.Add(source);
        }
        else
        {
            builder.Sources.Insert(index, source);
        }

        return builder;
    }

    /// <summary>
    /// KEY=VALUE per line; blank lines, "#" comments and a leading "export " are ignored, single or double quotes
    /// around the value are removed. "__" in a key becomes ":" as with environment variables.
    /// </summary>
    internal static Dictionary<string, string?> Parse(IEnumerable<string> lines)
    {
        var values = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        foreach (var raw in lines)
        {
            var line = raw.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            if (line.StartsWith("export ", StringComparison.Ordinal))
            {
                line = line["export ".Length..].TrimStart();
            }

            var separator = line.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var key = line[..separator].Trim().Replace("__", ConfigurationPath.KeyDelimiter, StringComparison.Ordinal);
            var value = line[(separator + 1)..].Trim();
            if (value.Length >= 2 && (value[0] is '"' or '\'') && value[^1] == value[0])
            {
                value = value[1..^1];
            }

            values[key] = value;
        }

        return values;
    }

    private sealed class DotEnvConfigurationSource(string path) : IConfigurationSource
    {
        public IConfigurationProvider Build(IConfigurationBuilder builder) => new DotEnvConfigurationProvider(path);
    }

    private sealed class DotEnvConfigurationProvider(string path) : ConfigurationProvider
    {
        public override void Load() => Data = File.Exists(path) ? Parse(File.ReadLines(path)) : new Dictionary<string, string?>();
    }
}
