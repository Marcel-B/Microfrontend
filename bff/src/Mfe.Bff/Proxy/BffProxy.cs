using System.Net.Http.Headers;
using Microsoft.AspNetCore.Authentication;
using Yarp.ReverseProxy.Transforms;

namespace Mfe.Bff.Proxy;

public static class BffProxy
{
    /// <summary>
    /// Route metadata key. Routes with "Bff.AccessToken": "true" forward the user's access token as a bearer
    /// token and never the session cookie. Combine with "AuthorizationPolicy": "default" to require a login.
    /// </summary>
    public const string AccessTokenMetadata = "Bff.AccessToken";

    public static IServiceCollection AddBffProxy(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddReverseProxy()
            .LoadFromConfig(configuration.GetSection("ReverseProxy"))
            .AddTransforms(context =>
            {
                if (context.Route.Metadata?.GetValueOrDefault(AccessTokenMetadata) != "true")
                {
                    return;
                }

                context.AddRequestHeaderRemove("Cookie");
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
