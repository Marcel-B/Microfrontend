using System.Security.Claims;
using Mfe.RemoteBff;

// Remote BFF of the React demo remote. It hosts the remote's UI and its API. The host BFF forwards
// /remotes/react-demo/** (UI) and /api/react-demo/** (API, with the user's access token) to this service.
var builder = WebApplication.CreateBuilder(args);
builder.AddRemoteBff();
builder.Services.AddAuthorizationBuilder().AddPolicy("admin", policy => policy.RequireRole("admin"));

var app = builder.Build();
app.UseRemoteBff();

const string service = "react-demo-bff";

// Who is calling? The demo page shows its admin hint based on this answer, not on the shell's view of the user.
app.MapGet("/api/me", (ClaimsPrincipal user) => new MeResponse(
        Name: user.Identity?.Name,
        Roles: [.. user.FindAll("role").Select(c => c.Value)],
        IsAdmin: user.IsInRole("admin"),
        CheckedBy: service))
    .RequireAuthorization();

// Only reachable with the admin role. The shell hides the page for other users, but the API checks again.
app.MapGet("/api/admin/status", (TimeProvider time) => new AdminStatusResponse(time.GetUtcNow(), service))
    .RequireAuthorization("admin");

app.MapRemoteUi();
app.Run();

internal sealed record MeResponse(string? Name, IReadOnlyList<string> Roles, bool IsAdmin, string CheckedBy);

internal sealed record AdminStatusResponse(DateTimeOffset ServerTime, string CheckedBy);
