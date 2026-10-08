using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Auth;

/// <summary>
/// Renews the access token stored in the session cookie with the refresh token shortly before it expires.
/// If renewal fails the session is dropped and the user has to log in again.
/// </summary>
public sealed class TokenRefresher(
    IHttpClientFactory httpClientFactory,
    IOptionsMonitor<OpenIdConnectOptions> oidcOptions,
    TimeProvider timeProvider,
    ILogger<TokenRefresher> logger)
{
    public const string HttpClientName = "oidc-token";

    private static readonly TimeSpan RefreshBeforeExpiry = TimeSpan.FromMinutes(1);

    public async Task RefreshIfNeededAsync(CookieValidatePrincipalContext context)
    {
        var tokens = context.Properties.GetTokens().ToList();
        var expiresAt = tokens.FirstOrDefault(t => t.Name == "expires_at")?.Value;
        var refreshToken = tokens.FirstOrDefault(t => t.Name == "refresh_token")?.Value;

        if (expiresAt is null || refreshToken is null
            || !DateTimeOffset.TryParse(expiresAt, CultureInfo.InvariantCulture, DateTimeStyles.None, out var expires)
            || expires - timeProvider.GetUtcNow() > RefreshBeforeExpiry)
        {
            return;
        }

        var options = oidcOptions.Get(OpenIdConnectDefaults.AuthenticationScheme);
        var configuration = await options.ConfigurationManager!.GetConfigurationAsync(context.HttpContext.RequestAborted);

        var response = await httpClientFactory.CreateClient(HttpClientName).PostAsync(
            configuration.TokenEndpoint,
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "refresh_token",
                ["refresh_token"] = refreshToken,
                ["client_id"] = options.ClientId!,
                ["client_secret"] = options.ClientSecret ?? string.Empty,
            }),
            context.HttpContext.RequestAborted);

        if (!response.IsSuccessStatusCode)
        {
            logger.LogInformation("Token refresh failed with {StatusCode}, ending session", response.StatusCode);
            context.RejectPrincipal();
            await context.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
            return;
        }

        var result = (await response.Content.ReadFromJsonAsync<TokenResponse>(context.HttpContext.RequestAborted))!;
        var newExpiry = timeProvider.GetUtcNow().AddSeconds(result.ExpiresIn);

        Set(tokens, "access_token", result.AccessToken);
        Set(tokens, "refresh_token", result.RefreshToken ?? refreshToken);
        Set(tokens, "expires_at", newExpiry.ToString("o", CultureInfo.InvariantCulture));
        if (result.IdToken is not null)
        {
            Set(tokens, "id_token", result.IdToken);
        }

        context.Properties.StoreTokens(tokens);
        context.ShouldRenew = true;
    }

    private static void Set(List<AuthenticationToken> tokens, string name, string value)
    {
        tokens.RemoveAll(t => t.Name == name);
        tokens.Add(new AuthenticationToken { Name = name, Value = value });
    }

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("refresh_token")] string? RefreshToken,
        [property: JsonPropertyName("id_token")] string? IdToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn);
}
