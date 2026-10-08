using Mfe.HostBff.Registry.Adapters.Http;
using Microsoft.AspNetCore.Authorization;
using Microsoft.OpenApi;

namespace Mfe.HostBff.OpenApi;

/// <summary>
/// OpenAPI document of the host BFF under /openapi/v1.json and Swagger UI under /swagger. The registry API asks for a
/// bearer token: one of a remote's service client from the Identity server (see README). Proxied routes (/remotes,
/// /api) belong to the remotes and are not listed. "OpenApi:Enabled": false turns both off.
/// </summary>
public static class HostOpenApi
{
    private const string BearerScheme = "registry-token";

    public static IServiceCollection AddHostOpenApi(this IServiceCollection services)
    {
        services.AddOpenApi(options =>
        {
            options.AddDocumentTransformer((document, context, _) =>
            {
                document.Info.Title = $"Host-BFF {context.ApplicationServices.GetRequiredService<IHostEnvironment>().ApplicationName}";
                document.Info.Description =
                    "Registration of remotes, the shell's session and remote endpoints. Remotes call PUT /registry/remotes/{id} " +
                    "with a client-credentials token of the Identity server (scope = Registry:Audience).";
                document.Components ??= new OpenApiComponents();
                document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
                document.Components.SecuritySchemes[BearerScheme] = new OpenApiSecurityScheme
                {
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "Access token of a remote's service client (client credentials).",
                };
                return Task.CompletedTask;
            });

            options.AddOperationTransformer((operation, context, _) =>
            {
                var needsToken = context.Description.ActionDescriptor.EndpointMetadata
                    .OfType<IAuthorizeData>()
                    .Any(a => a.Policy == RegistryAuthorization.RemotePolicy);
                if (needsToken)
                {
                    operation.Security = [new OpenApiSecurityRequirement { [new OpenApiSecuritySchemeReference(BearerScheme, context.Document)] = [] }];
                }

                return Task.CompletedTask;
            });
        });
        return services;
    }

    public static WebApplication UseHostOpenApi(this WebApplication app)
    {
        if (!app.Configuration.GetValue("OpenApi:Enabled", true))
        {
            return app;
        }

        app.MapOpenApi().WithTags("OpenApi");
        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/openapi/v1.json", "Host-BFF");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = "Host-BFF API";
        });
        return app;
    }
}
