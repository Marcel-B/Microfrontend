using Mfe.HostBff;

// Host BFF of the Vue variant: serves the shell, handles login (OIDC + cookie session) and forwards
// remotes and their APIs. Everything variant-specific lives in appsettings.json.
var builder = WebApplication.CreateBuilder(args);
builder.AddHostBff();

var app = builder.Build();
app.UseHostBff();
app.Run();
