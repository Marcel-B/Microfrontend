using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authentication;
using Yarp.ReverseProxy.Transforms;

namespace Mfe.HostBff.Proxy;

public static class BffProxy
{
    /// <summary>
    /// Route metadata key. Routes with "Bff.AccessToken": "true" forward the user's access token as a bearer
    /// token. Combine with "AuthorizationPolicy": "default" to require a login.
    /// </summary>
    public const string AccessTokenMetadata = "Bff.AccessToken";

    public static IServiceCollection AddBffProxy(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddReverseProxy()
            .LoadFromConfig(configuration.GetSection("ReverseProxy"))
            .AddTransforms(context =>
            {
                // The session cookie belongs to this BFF only. Remote BFFs and dev servers never see it.
                context.AddRequestHeaderRemove("Cookie");

                if (context.Route.Metadata?.GetValueOrDefault(AccessTokenMetadata) != "true")
                {
                    return;
                }

                context.AddRequestTransform(async transform =>
                {
                    var token = await transform.HttpContext.GetTokenAsync("access_token");
                    if (token is not null)
                    {
                        transform.ProxyRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                    }
                });
            });

        return services;
    }
}
