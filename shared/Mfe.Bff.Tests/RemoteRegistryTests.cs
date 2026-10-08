using Mfe.HostBff.Registry.Adapters.Persistence;
using Mfe.HostBff.Registry.Application;
using Mfe.HostBff.Registry.Domain;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Time.Testing;

namespace Mfe.Bff.Tests;

/// <summary>The registry's use cases with fake adapters: no HTTP, no YARP, time under control.</summary>
public sealed class RemoteRegistryTests
{
    private readonly FakeTimeProvider _time = new(new DateTimeOffset(2026, 10, 8, 12, 0, 0, TimeSpan.Zero));
    private readonly FakeProbe _probe = new();
    private readonly FakeRoutes _routes = new();
    private readonly RegistryOptions _options = new() { ReservedIds = ["vue-components"] };
    private readonly RemoteRegistry _registry;

    public RemoteRegistryTests()
    {
        var options = Microsoft.Extensions.Options.Options.Create(_options);
        _registry = new RemoteRegistry(new InMemoryRegistryStore(options), _probe, _routes, options, _time, NullLogger<RemoteRegistry>.Instance);
    }

    [Fact]
    public async Task A_reachable_remote_is_routed_and_listed_for_the_shell()
    {
        var result = await RegisterAsync(Remote("vue-demo"));

        Assert.Equal(RegistrationOutcome.Registered, result.Outcome);
        Assert.Equal(RemoteHealth.Healthy, result.Remote!.Health);
        Assert.Equal("vue-demo", Assert.Single(_registry.Reachable()).Id);
        Assert.Equal(["vue-demo"], _routes.Ids);
        Assert.Equal([RegistryEventKind.Reachable, RegistryEventKind.Registered], Kinds());
    }

    [Fact]
    public async Task A_remote_that_does_not_answer_is_routed_but_not_listed()
    {
        _probe.Healthy = false;

        var result = await RegisterAsync(Remote("vue-demo"));

        Assert.Equal(RemoteHealth.Unreachable, result.Remote!.Health);
        Assert.Empty(_registry.Reachable());
        Assert.Equal(["vue-demo"], _routes.Ids);
        Assert.Equal(RegistryEventKind.Unreachable, Kinds()[0]);
    }

    [Fact]
    public async Task A_remote_leaves_the_navigation_after_the_threshold_of_failed_checks_and_comes_back()
    {
        await RegisterAsync(Remote("vue-demo"));
        _probe.Healthy = false;

        await _registry.CheckAllAsync(CancellationToken.None);
        Assert.Single(_registry.Reachable());

        await _registry.CheckAllAsync(CancellationToken.None);
        Assert.Empty(_registry.Reachable());
        Assert.Equal("connection refused", _registry.Snapshot().Remotes.Single().LastError);

        _probe.Healthy = true;
        await _registry.CheckAllAsync(CancellationToken.None);
        Assert.Single(_registry.Reachable());
        Assert.Equal([RegistryEventKind.Reachable, RegistryEventKind.Unreachable], Kinds()[..2]);
    }

    [Fact]
    public async Task Heartbeats_keep_a_remote_and_without_them_it_expires()
    {
        await RegisterAsync(Remote("vue-demo"));

        _time.Advance(TimeSpan.FromSeconds(20));
        Assert.Equal(RegistrationOutcome.Renewed, (await RegisterAsync(Remote("vue-demo"))).Outcome);
        _time.Advance(TimeSpan.FromSeconds(20));
        await _registry.CheckAllAsync(CancellationToken.None);
        Assert.Single(_registry.Reachable());

        _time.Advance(_options.LeaseDuration);
        await _registry.CheckAllAsync(CancellationToken.None);

        Assert.Empty(_registry.Reachable());
        Assert.Empty(_routes.Ids);
        var former = Assert.Single(_registry.Snapshot().Former);
        Assert.Equal(RegistryEventKind.Expired, former.Reason);
        Assert.Equal(_time.GetUtcNow(), former.LeftAt);
    }

    [Fact]
    public async Task A_heartbeat_with_the_same_registration_adds_no_history_but_a_change_does()
    {
        await RegisterAsync(Remote("vue-demo"));
        var before = _registry.Snapshot().History.Count;

        await RegisterAsync(Remote("vue-demo"));
        Assert.Equal(before, _registry.Snapshot().History.Count);

        await RegisterAsync(Remote("vue-demo", version: "2.0.0"));
        Assert.Equal(RegistryEventKind.Changed, Kinds()[0]);
        Assert.Equal("2.0.0", Assert.Single(_registry.Reachable()).Version);
    }

    [Fact]
    public async Task Deregistration_removes_the_remote_and_keeps_it_as_former()
    {
        await RegisterAsync(Remote("vue-demo"));

        Assert.Equal(DeregistrationOutcome.Deregistered, _registry.Deregister("vue-demo", "mfe-vue-demo"));

        Assert.Empty(_registry.Reachable());
        Assert.Empty(_routes.Ids);
        Assert.Equal(RegistryEventKind.Deregistered, Assert.Single(_registry.Snapshot().Former).Reason);
        Assert.Equal(DeregistrationOutcome.NotFound, _registry.Deregister("vue-demo", "mfe-vue-demo"));
    }

    [Fact]
    public async Task Only_the_client_that_registered_a_remote_may_change_or_deregister_it()
    {
        await RegisterAsync(Remote("vue-demo"));

        Assert.Equal(RegistrationOutcome.Forbidden, (await RegisterAsync(Remote("vue-demo"), owner: "intruder")).Outcome);
        Assert.Equal(DeregistrationOutcome.Forbidden, _registry.Deregister("vue-demo", "intruder"));
        Assert.Single(_registry.Reachable());
    }

    [Theory]
    [InlineData("/debug")]
    [InlineData("/debug/registry")]
    [InlineData("/login")]
    [InlineData("/api/x")]
    public async Task Pages_cannot_take_shell_routes(string path)
    {
        var result = await RegisterAsync(Remote("vue-demo", path: path));

        Assert.Equal(RegistrationOutcome.Conflict, result.Outcome);
        Assert.Empty(_routes.Ids);
    }

    [Fact]
    public async Task Pages_cannot_take_routes_of_another_remote()
    {
        await RegisterAsync(Remote("vue-demo", path: "/demo"));

        var result = await RegisterAsync(Remote("vue-other", path: "/Demo", federationName: "vueOther"), owner: "mfe-vue-other");

        Assert.Equal(RegistrationOutcome.Conflict, result.Outcome);
        Assert.Contains(result.Problems, p => p.Message.Contains("vue-demo", StringComparison.Ordinal));
    }

    [Fact]
    public async Task Ids_of_static_routes_are_taken()
    {
        var result = await RegisterAsync(Remote("vue-components"));

        Assert.Equal(RegistrationOutcome.Conflict, result.Outcome);
    }

    [Fact]
    public async Task Invalid_registrations_are_refused_and_logged_once()
    {
        var invalid = Remote("Vue_Demo") with { Pages = [Page("/demo") with { Title = new Dictionary<string, string> { ["de"] = "Demo" }, Module = "DemoPage" }] };

        var result = await RegisterAsync(invalid);
        await RegisterAsync(invalid);

        Assert.Equal(RegistrationOutcome.Invalid, result.Outcome);
        Assert.Contains(result.Problems, p => p.Field == "id");
        Assert.Contains(result.Problems, p => p.Field == "pages[0].title.en");
        Assert.Contains(result.Problems, p => p.Field == "pages[0].module");
        Assert.Equal([RegistryEventKind.Rejected], Kinds());
    }

    [Theory]
    [InlineData("")]
    [InlineData(" Demo")]
    [InlineData("A group name that is far too long for the navigation")]
    public async Task Every_remote_needs_a_usable_group(string group)
    {
        var result = await RegisterAsync(Remote("vue-demo", group: group));

        Assert.Equal(RegistrationOutcome.Invalid, result.Outcome);
        Assert.Equal("group", Assert.Single(result.Problems).Field);
    }

    [Fact]
    public async Task A_new_group_counts_as_a_change()
    {
        await RegisterAsync(Remote("vue-demo"));

        await RegisterAsync(Remote("vue-demo", group: "Tools"));

        Assert.Equal(RegistryEventKind.Changed, Kinds()[0]);
        Assert.Equal("Tools", Assert.Single(_registry.Reachable()).Group);
    }

    [Fact]
    public async Task Remotes_are_listed_in_navigation_order()
    {
        await RegisterAsync(Remote("b-remote", path: "/b", federationName: "b", order: 1));
        await RegisterAsync(Remote("a-remote", path: "/a", federationName: "a", order: 2));

        Assert.Equal(["b-remote", "a-remote"], _registry.Reachable().Select(r => r.Id));
    }

    private Task<RegistrationResult> RegisterAsync(RemoteRegistration registration, string owner = "mfe-vue-demo") =>
        _registry.RegisterAsync(registration, owner, CancellationToken.None);

    private List<RegistryEventKind> Kinds() => [.. _registry.Snapshot().History.Select(e => e.Kind)];

    private static RemoteRegistration Remote(string id, string path = "/demo", string federationName = "vueDemo", string? version = "1.0.0", int order = 0, string group = "Demo") =>
        new(id, federationName, new Uri("http://localhost:5011"), version, new Dictionary<string, string> { ["de"] = "Demo" },
            group, "vue-demo-api", "/health", [Page(path) with { Order = order }]);

    private static RemotePage Page(string path) => new(
        path, new Dictionary<string, string> { ["de"] = "Klick-Demo", ["en"] = "Click demo" }, "./DemoPage", "pi pi-star",
        RequiresAuth: false, Roles: [], ShowInNav: true, Order: 0);

    private sealed class FakeProbe : IHealthProbe
    {
        public bool Healthy { get; set; } = true;

        public Task<HealthProbeResult> ProbeAsync(Uri healthUrl, CancellationToken cancellationToken) =>
            Task.FromResult(Healthy ? HealthProbeResult.Ok : HealthProbeResult.Failed("connection refused"));
    }

    private sealed class FakeRoutes : IRemoteRoutes
    {
        public List<string> Ids { get; private set; } = [];

        public void Update(IReadOnlyList<RemoteRegistration> remotes) => Ids = [.. remotes.Select(r => r.Id)];
    }
}
