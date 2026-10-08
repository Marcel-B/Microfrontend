namespace Mfe.HostBff.Registry.Domain;

public enum RegistryEventKind
{
    /// <summary>A remote the host did not know registered (also after a restart of the host).</summary>
    Registered,

    /// <summary>A heartbeat brought a changed registration (pages, roles, version, address, …).</summary>
    Changed,

    /// <summary>The remote deregistered itself, usually because it shuts down.</summary>
    Deregistered,

    /// <summary>No heartbeat within the lease: the remote is gone without deregistering (crash, network).</summary>
    Expired,

    /// <summary>The remote answered its health check (the first one, or again after being unreachable).</summary>
    Reachable,

    /// <summary>The remote did not answer its health check and left the navigation.</summary>
    Unreachable,

    /// <summary>A registration or deregistration the host refused (invalid, path taken, foreign owner).</summary>
    Rejected,
}

/// <summary>An entry of the registry's history, shown on the shell's registry page.</summary>
public sealed record RegistryEvent(DateTimeOffset At, string RemoteId, RegistryEventKind Kind, string? Owner, string? Detail);

/// <summary>A remote the host no longer lists, with when and why it left.</summary>
public sealed record FormerRemote(RemoteRegistration Registration, string Owner, DateTimeOffset RegisteredAt, DateTimeOffset LeftAt, RegistryEventKind Reason);
