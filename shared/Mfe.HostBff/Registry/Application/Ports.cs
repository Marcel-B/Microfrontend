using Mfe.HostBff.Registry.Domain;

namespace Mfe.HostBff.Registry.Application;

// Driven ports of the registry. The adapters live in Registry/Adapters; tests replace them.

/// <summary>
/// Where the registry keeps its remotes and history. The host has no database: the in-memory adapter forgets everything
/// on a restart and the heartbeats fill it again. Several instances of one host would need a shared store (e.g. Redis)
/// behind this port, since a heartbeat reaches only one of them.
/// </summary>
public interface IRegistryStore
{
    IReadOnlyList<RegisteredRemote> All();

    RegisteredRemote? Find(string id);

    void Save(RegisteredRemote remote);

    void Remove(string id);

    void AddFormer(FormerRemote former);

    /// <summary>Remotes that deregistered or expired, newest first.</summary>
    IReadOnlyList<FormerRemote> Former();

    void Append(RegistryEvent registryEvent);

    /// <summary>The history, newest first.</summary>
    IReadOnlyList<RegistryEvent> History();
}

/// <summary>Asks a remote whether it is up.</summary>
public interface IHealthProbe
{
    Task<HealthProbeResult> ProbeAsync(Uri healthUrl, CancellationToken cancellationToken);
}

public sealed record HealthProbeResult(bool Healthy, string? Error)
{
    public static readonly HealthProbeResult Ok = new(true, null);

    public static HealthProbeResult Failed(string error) => new(false, error);
}

/// <summary>
/// Makes the host forward /remotes/{id}/ and /api/{id}/ to the registered remotes. Gets the complete list after every
/// change, so an adapter never has to work out differences.
/// </summary>
public interface IRemoteRoutes
{
    void Update(IReadOnlyList<RemoteRegistration> remotes);
}
