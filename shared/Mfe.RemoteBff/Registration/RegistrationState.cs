namespace Mfe.RemoteBff.Registration;

/// <summary>Whether the host knows this remote right now. Feeds the readiness check under /health/ready.</summary>
public sealed class RegistrationState
{
    private volatile Snapshot _current = new(false, null, null, null);

    public Snapshot Current => _current;

    internal void Succeeded(DateTimeOffset at, string health) => _current = new(true, at, health, null);

    internal void Failed(string error) => _current = _current with { IsRegistered = false, LastError = error };

    internal void Deregistered() => _current = _current with { IsRegistered = false, Health = null };

    public sealed record Snapshot(bool IsRegistered, DateTimeOffset? LastHeartbeatAt, string? Health, string? LastError);
}
