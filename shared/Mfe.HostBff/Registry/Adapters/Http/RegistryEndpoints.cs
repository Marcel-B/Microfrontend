using System.Security.Claims;
using Mfe.HostBff.Options;
using Mfe.HostBff.Registry.Application;
using Mfe.HostBff.Registry.Domain;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace Mfe.HostBff.Registry.Adapters.Http;

/// <summary>
/// The registry over HTTP: the API remotes register with (bearer token from the Identity server), the reachable
/// remotes for the shell and the whole registry for admins.
/// </summary>
public static class RegistryEndpoints
{
    public static IEndpointRouteBuilder MapRegistryEndpoints(this IEndpointRouteBuilder app)
    {
        var remotes = app.MapGroup("/registry/remotes")
            .RequireAuthorization(RegistryAuthorization.RemotePolicy)
            .WithTags("Registry");

        remotes.MapPut("/{id}", RegisterAsync)
            .WithSummary("Registers a remote or renews its registration (heartbeat)")
            .WithDescription(
                "Send the full registration at start and again every heartbeatSeconds of the answer. Without a heartbeat " +
                "the registration ends after leaseSeconds. Only the client that registered a remote may renew or deregister it.");

        remotes.MapDelete("/{id}", Deregister)
            .WithSummary("Deregisters a remote, e.g. when it shuts down");

        app.MapGet("/bff/remotes", (RemoteRegistry registry) =>
                new ShellRemotes([.. registry.Reachable().Select(ShellRemote.From)]))
            .WithTags("Shell")
            .WithSummary("Reachable remotes with their pages, for the shell's routes and navigation");

        app.MapGet("/bff/registry", (RemoteRegistry registry, IConfiguration configuration) => View(registry, configuration))
            .RequireAuthorization(RegistryAuthorization.AdminPolicy)
            .WithTags("Shell")
            .WithSummary("Registered, former and unreachable remotes with their history (admins only)");

        return app;
    }

    private static async Task<Results<Ok<RegistrationResponse>, ValidationProblem, Conflict<HttpValidationProblemDetails>, ProblemHttpResult>> RegisterAsync(
        string id,
        RegisterRemoteRequest request,
        ClaimsPrincipal caller,
        RemoteRegistry registry,
        CancellationToken cancellationToken)
    {
        if (!Uri.TryCreate(request.Address, UriKind.Absolute, out var address))
        {
            return TypedResults.ValidationProblem(new Dictionary<string, string[]> { ["address"] = ["Must be an absolute URL."] });
        }

        var result = await registry.RegisterAsync(request.ToDomain(id, address), RegistryAuthorization.Owner(caller), cancellationToken);
        var errors = result.Problems.GroupBy(p => p.Field).ToDictionary(g => g.Key, g => g.Select(p => p.Message).ToArray());

        return result.Outcome switch
        {
            RegistrationOutcome.Registered or RegistrationOutcome.Renewed => TypedResults.Ok(Response(result.Remote!, result.Outcome, registry.Options)),
            RegistrationOutcome.Conflict => TypedResults.Conflict(new HttpValidationProblemDetails(errors)
            {
                Title = "The registration collides with the shell or another remote.",
                Status = StatusCodes.Status409Conflict,
            }),
            RegistrationOutcome.Forbidden => TypedResults.Problem(result.Problems[0].Message, statusCode: StatusCodes.Status403Forbidden),
            _ => TypedResults.ValidationProblem(errors),
        };
    }

    private static Results<NoContent, NotFound, ProblemHttpResult> Deregister(string id, ClaimsPrincipal caller, RemoteRegistry registry) =>
        registry.Deregister(id, RegistryAuthorization.Owner(caller)) switch
        {
            DeregistrationOutcome.Deregistered => TypedResults.NoContent(),
            DeregistrationOutcome.NotFound => TypedResults.NotFound(),
            _ => TypedResults.Problem($"Remote '{id}' is registered by another client.", statusCode: StatusCodes.Status403Forbidden),
        };

    private static RegistrationResponse Response(RegisteredRemote remote, RegistrationOutcome outcome, RegistryOptions options) => new(
        remote.Id,
        outcome,
        remote.Health,
        remote.Registration.Entry,
        remote.LeaseExpiresAt,
        (int)options.LeaseDuration.TotalSeconds,
        (int)options.HeartbeatInterval.TotalSeconds);

    private static RegistryView View(RemoteRegistry registry, IConfiguration configuration)
    {
        var options = registry.Options;
        var scopes = configuration.GetSection(OidcOptions.SectionName).Get<OidcOptions>()?.Scopes ?? [];
        var snapshot = registry.Snapshot();

        return new RegistryView(
            snapshot.At,
            new RegistrySettingsView(
                options.Audience,
                (int)options.LeaseDuration.TotalSeconds,
                (int)options.HeartbeatInterval.TotalSeconds,
                (int)options.HealthCheckInterval.TotalSeconds,
                options.FailureThreshold,
                scopes),
            [.. snapshot.Remotes.Select(r => RemoteView.From(r, scopes))],
            [.. snapshot.Former.Select(FormerRemoteView.From)],
            snapshot.History);
    }
}
