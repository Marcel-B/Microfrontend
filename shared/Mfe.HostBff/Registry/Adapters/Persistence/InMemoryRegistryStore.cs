using Mfe.HostBff.Registry.Application;
using Mfe.HostBff.Registry.Domain;
using Microsoft.Extensions.Options;

namespace Mfe.HostBff.Registry.Adapters.Persistence;

/// <summary>
/// Keeps the registry in this process only. <see cref="RemoteRegistry"/> calls it under its lock, so it needs none
/// of its own. History and former remotes are capped at <see cref="RegistryOptions.HistorySize"/>.
/// </summary>
public sealed class InMemoryRegistryStore(IOptions<RegistryOptions> options) : IRegistryStore
{
    private readonly Dictionary<string, RegisteredRemote> _remotes = new(StringComparer.Ordinal);
    private readonly LinkedList<FormerRemote> _former = [];
    private readonly LinkedList<RegistryEvent> _history = [];
    private readonly int _limit = Math.Max(1, options.Value.HistorySize);

    public IReadOnlyList<RegisteredRemote> All() => [.. _remotes.Values];

    public RegisteredRemote? Find(string id) => _remotes.GetValueOrDefault(id);

    public void Save(RegisteredRemote remote) => _remotes[remote.Id] = remote;

    public void Remove(string id) => _remotes.Remove(id);

    public void AddFormer(FormerRemote former) => AddCapped(_former, former);

    public IReadOnlyList<FormerRemote> Former() => [.. _former];

    public void Append(RegistryEvent registryEvent) => AddCapped(_history, registryEvent);

    public IReadOnlyList<RegistryEvent> History() => [.. _history];

    private void AddCapped<T>(LinkedList<T> list, T item)
    {
        list.AddFirst(item);
        while (list.Count > _limit)
        {
            list.RemoveLast();
        }
    }
}
