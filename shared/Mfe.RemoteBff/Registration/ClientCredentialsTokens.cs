using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Options;

namespace Mfe.RemoteBff.Registration;

/// <summary>
/// Gets and caches this remote's own access token from the Identity server (client credentials). A heartbeat every
/// few seconds must not cost a token request each time.
/// </summary>
public sealed class ClientCredentialsTokens(
    IHttpClientFactory httpClientFactory,
    IOptions<RegistrationOptions> options,
    TimeProvider time)
{
    public const string HttpClientName = "registration-token";

    private static readonly TimeSpan RenewBeforeExpiry = TimeSpan.FromSeconds(30);

    private readonly SemaphoreSlim _gate = new(1, 1);
    private string? _token;
    private DateTimeOffset _expiresAt;
    private string? _tokenEndpoint;

    public async Task<string> GetAsync(CancellationToken cancellationToken)
    {
        await _gate.WaitAsync(cancellationToken);
        try
        {
            if (_token is not null && time.GetUtcNow() < _expiresAt - RenewBeforeExpiry)
            {
                return _token;
            }

            var settings = options.Value;
            var client = httpClientFactory.CreateClient(HttpClientName);
            _tokenEndpoint ??= await TokenEndpointAsync(client, settings, cancellationToken);

            using var response = await client.PostAsync(_tokenEndpoint, new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["grant_type"] = "client_credentials",
                ["client_id"] = settings.ClientId,
                ["client_secret"] = settings.ClientSecret ?? string.Empty,
                ["scope"] = settings.Scope,
            }), cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                throw new HttpRequestException(
                    $"Token request for client '{settings.ClientId}' failed with {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync(cancellationToken)}");
            }

            var token = (await response.Content.ReadFromJsonAsync<TokenResponse>(cancellationToken))!;
            _token = token.AccessToken;
            _expiresAt = time.GetUtcNow().AddSeconds(token.ExpiresIn);
            return _token;
        }
        finally
        {
            _gate.Release();
        }
    }

    /// <summary>The host refused the token (e.g. the Identity server restarted with new keys): fetch a new one.</summary>
    public void Forget() => _token = null;

    private static async Task<string> TokenEndpointAsync(HttpClient client, RegistrationOptions settings, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrEmpty(settings.TokenEndpoint))
        {
            return settings.TokenEndpoint;
        }

        var authority = settings.Authority!.TrimEnd('/');
        if (settings.RequireHttpsMetadata && !authority.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"The Identity server {authority} must use HTTPS (Registration:RequireHttpsMetadata).");
        }

        var discovery = await client.GetFromJsonAsync<Discovery>($"{authority}/.well-known/openid-configuration", cancellationToken);
        return discovery?.TokenEndpoint ?? throw new InvalidOperationException($"{authority} has no token endpoint.");
    }

    private sealed record Discovery([property: JsonPropertyName("token_endpoint")] string? TokenEndpoint);

    private sealed record TokenResponse(
        [property: JsonPropertyName("access_token")] string AccessToken,
        [property: JsonPropertyName("expires_in")] int ExpiresIn);
}
