namespace Mfe.HostBff.Registry.Domain;

public enum RemoteHealth
{
    /// <summary>Not checked yet. Not shown in the navigation: the address the remote gave may be wrong.</summary>
    Unknown,

    /// <summary>Answered its last health check, or failed fewer times in a row than the threshold allows.</summary>
    Healthy,

    /// <summary>Failed the threshold of health checks in a row, or never answered. Not shown in the navigation.</summary>
    Unreachable,
}

/// <summary>A remote with a valid lease: its registration, who owns it and how its health checks went.</summary>
public sealed class RegisteredRemote
{
    public RegisteredRemote(RemoteRegistration registration, string owner, DateTimeOffset now, TimeSpan lease)
    {
        Registration = registration;
        Owner = owner;
        RegisteredAt = now;
        LastHeartbeatAt = now;
        LeaseExpiresAt = now + lease;
    }

    public RemoteRegistration Registration { get; private set; }

    /// <summary>Who registered the remote: the remote id its API key belongs to. Only it may renew or deregister it.</summary>
    public string Owner { get; }

    public DateTimeOffset RegisteredAt { get; }

    public DateTimeOffset LastHeartbeatAt { get; private set; }

    public DateTimeOffset LeaseExpiresAt { get; private set; }

    public RemoteHealth Health { get; private set; } = RemoteHealth.Unknown;

    public DateTimeOffset? LastCheckedAt { get; private set; }

    public DateTimeOffset? LastHealthyAt { get; private set; }

    public int ConsecutiveFailures { get; private set; }

    public string? LastError { get; private set; }

    public string Id => Registration.Id;

    public bool IsExpired(DateTimeOffset now) => now >= LeaseExpiresAt;

    /// <summary>A heartbeat: extends the lease and takes over changes. Returns whether the registration changed.</summary>
    public bool Renew(RemoteRegistration registration, DateTimeOffset now, TimeSpan lease)
    {
        var changed = !RegistrationComparer.Equal(Registration, registration);
        Registration = registration;
        LastHeartbeatAt = now;
        LeaseExpiresAt = now + lease;
        return changed;
    }

    /// <summary>Records a health check. Returns the new health if it changed, otherwise null.</summary>
    public RemoteHealth? RecordCheck(bool healthy, string? error, DateTimeOffset now, int failureThreshold)
    {
        var before = Health;
        LastCheckedAt = now;

        if (healthy)
        {
            ConsecutiveFailures = 0;
            LastError = null;
            LastHealthyAt = now;
            Health = RemoteHealth.Healthy;
        }
        else
        {
            ConsecutiveFailures++;
            LastError = error;
            // A single failed check of a healthy remote may be a hiccup; a remote that never answered stays out.
            if (ConsecutiveFailures >= failureThreshold || Health == RemoteHealth.Unknown)
            {
                Health = RemoteHealth.Unreachable;
            }
        }

        return Health == before ? null : Health;
    }
}
