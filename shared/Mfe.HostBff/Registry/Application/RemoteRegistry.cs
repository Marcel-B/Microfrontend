using Mfe.HostBff.Registry.Domain;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Registry.Application;

public enum RegistrationOutcome
{
    Registered,
    Renewed,
    Invalid,
    Conflict,
    Forbidden,
}

public sealed record RegistrationResult(RegistrationOutcome Outcome, RegisteredRemote? Remote, IReadOnlyList<RegistrationProblem> Problems);

public enum DeregistrationOutcome
{
    Deregistered,
    NotFound,
    Forbidden,
}

/// <summary>Everything the registry knows, for the admin page.</summary>
public sealed record RegistrySnapshot(
    DateTimeOffset At,
    IReadOnlyList<RegisteredRemote> Remotes,
    IReadOnlyList<FormerRemote> Former,
    IReadOnlyList<RegistryEvent> History);

/// <summary>
/// The registry's use cases: remotes register (and renew with every heartbeat) and deregister, the host checks their
/// health and drops expired leases, the shell gets the reachable remotes. Knows neither HTTP nor YARP; the adapters
/// behind <see cref="IRegistryStore"/>, <see cref="IHealthProbe"/> and <see cref="IRemoteRoutes"/> do.
/// </summary>
public sealed class RemoteRegistry(
    IRegistryStore store,
    IHealthProbe probe,
    IRemoteRoutes routes,
    IOptions<RegistryOptions> options,
    TimeProvider time,
    ILogger<RemoteRegistry> logger)
{
    private readonly RegistryOptions _options = options.Value;

    // One host instance, one lock: registrations, deregistrations and health results never interleave. Probes run
    // outside of it, so a slow remote does not hold up heartbeats.
    private readonly Lock _lock = new();

    public RegistryOptions Options => _options;

    public async Task<RegistrationResult> RegisterAsync(RemoteRegistration registration, string owner, CancellationToken cancellationToken)
    {
        RegisteredRemote added;
        lock (_lock)
        {
            var now = time.GetUtcNow();
            var existing = store.Find(registration.Id);

            if (existing is not null && existing.Owner != owner)
            {
                var problem = new RegistrationProblem("id", $"Remote '{registration.Id}' is registered by another client.");
                Reject(registration.Id, owner, problem.Message);
                return new(RegistrationOutcome.Forbidden, null, [problem]);
            }

            var problems = RegistrationRules.Check(
                registration,
                store.All().Where(r => r.Id != registration.Id).Select(r => r.Registration),
                _options.ReservedPaths,
                _options.RequiredLanguages,
                _options.ReservedIds);
            if (problems.Count > 0)
            {
                Reject(registration.Id, owner, string.Join(" ", problems.Select(p => $"{p.Field}: {p.Message}")));
                return new(problems.Any(p => p.Conflict) ? RegistrationOutcome.Conflict : RegistrationOutcome.Invalid, null, problems);
            }

            if (existing is not null)
            {
                if (existing.Renew(registration, now, _options.LeaseDuration))
                {
                    Record(now, registration.Id, RegistryEventKind.Changed, owner, Describe(registration));
                    PublishRoutes();
                }

                return new(RegistrationOutcome.Renewed, existing, []);
            }

            added = new RegisteredRemote(registration, owner, now, _options.LeaseDuration);
            store.Save(added);
            Record(now, registration.Id, RegistryEventKind.Registered, owner, Describe(registration));
            PublishRoutes();
        }

        // A new remote shows up in the navigation only once it answered: the address it gave may be wrong.
        await CheckAsync(added, cancellationToken);
        return new(RegistrationOutcome.Registered, added, []);
    }

    public DeregistrationOutcome Deregister(string id, string owner)
    {
        lock (_lock)
        {
            var remote = store.Find(id);
            if (remote is null)
            {
                return DeregistrationOutcome.NotFound;
            }

            if (remote.Owner != owner)
            {
                Reject(id, owner, "Deregistration by another client.");
                return DeregistrationOutcome.Forbidden;
            }

            Drop(remote, RegistryEventKind.Deregistered, time.GetUtcNow(), detail: null);
            return DeregistrationOutcome.Deregistered;
        }
    }

    /// <summary>One round of the host's housekeeping: drops expired leases, then checks every remote's health.</summary>
    public async Task CheckAllAsync(CancellationToken cancellationToken)
    {
        List<RegisteredRemote> remotes;
        lock (_lock)
        {
            var now = time.GetUtcNow();
            foreach (var expired in store.All().Where(r => r.IsExpired(now)).ToList())
            {
                Drop(expired, RegistryEventKind.Expired, now, $"Last heartbeat {expired.LastHeartbeatAt:O}.");
            }

            remotes = [.. store.All()];
        }

        await Task.WhenAll(remotes.Select(remote => CheckAsync(remote, cancellationToken)));
    }

    /// <summary>The reachable remotes for the shell, in navigation order.</summary>
    public IReadOnlyList<RemoteRegistration> Reachable()
    {
        lock (_lock)
        {
            return
            [
                .. store.All()
                    .Where(r => r.Health == RemoteHealth.Healthy)
                    .Select(r => r.Registration)
                    .OrderBy(r => r.Pages.Min(p => p.Order))
                    .ThenBy(r => r.Id, StringComparer.Ordinal),
            ];
        }
    }

    public RegistrySnapshot Snapshot()
    {
        lock (_lock)
        {
            return new(time.GetUtcNow(), [.. store.All().OrderBy(r => r.Id, StringComparer.Ordinal)], store.Former(), store.History());
        }
    }

    private async Task CheckAsync(RegisteredRemote remote, CancellationToken cancellationToken)
    {
        HealthProbeResult result;
        try
        {
            result = await probe.ProbeAsync(remote.Registration.HealthUrl, cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException || !cancellationToken.IsCancellationRequested)
        {
            result = HealthProbeResult.Failed(exception.Message);
        }

        lock (_lock)
        {
            // Deregistered or replaced while the probe ran: the result belongs to a remote the registry no longer has.
            if (!ReferenceEquals(store.Find(remote.Id), remote))
            {
                return;
            }

            var now = time.GetUtcNow();
            var changed = remote.RecordCheck(result.Healthy, result.Error, now, _options.FailureThreshold);
            if (changed == RemoteHealth.Unreachable)
            {
                Record(now, remote.Id, RegistryEventKind.Unreachable, remote.Owner, result.Error);
            }
            else if (changed == RemoteHealth.Healthy)
            {
                Record(now, remote.Id, RegistryEventKind.Reachable, remote.Owner, null);
            }
        }
    }

    private void Drop(RegisteredRemote remote, RegistryEventKind reason, DateTimeOffset now, string? detail)
    {
        store.Remove(remote.Id);
        store.AddFormer(new FormerRemote(remote.Registration, remote.Owner, remote.RegisteredAt, now, reason));
        Record(now, remote.Id, reason, remote.Owner, detail);
        PublishRoutes();
    }

    /// <summary>A misconfigured remote repeats its heartbeat every few seconds; the history keeps one entry per reason.</summary>
    private void Reject(string id, string owner, string detail)
    {
        var last = store.History().FirstOrDefault(e => e.RemoteId == id);
        if (last is { Kind: RegistryEventKind.Rejected } && last.Detail == detail && last.Owner == owner)
        {
            return;
        }

        Record(time.GetUtcNow(), id, RegistryEventKind.Rejected, owner, detail);
    }

    private void Record(DateTimeOffset at, string id, RegistryEventKind kind, string? owner, string? detail)
    {
        store.Append(new RegistryEvent(at, id, kind, owner, detail));
        logger.LogInformation("Remote {RemoteId}: {Event} {Detail}", id, kind, detail);
    }

    private void PublishRoutes() => routes.Update([.. store.All().Select(r => r.Registration)]);

    private static string Describe(RemoteRegistration registration) =>
        $"{registration.Address} v{registration.Version ?? "?"}, pages {string.Join(", ", registration.Pages.Select(p => p.Path))}";
}
