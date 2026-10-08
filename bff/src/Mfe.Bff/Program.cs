using Mfe.Bff.Auth;
using Mfe.Bff.Endpoints;
using Mfe.Bff.Options;
using Mfe.Bff.Proxy;

var builder = WebApplication.CreateBuilder(args);

builder.Services.Configure<FrontendOptions>(builder.Configuration.GetSection(FrontendOptions.SectionName));
builder.Services.AddBffAuthentication(builder.Configuration);
builder.Services.AddBffProxy(builder.Configuration);
builder.Services.AddProblemDetails();

var app = builder.Build();

app.UseAuthentication();
app.UseMiddleware<CsrfHeaderMiddleware>();
app.UseAuthorization();

app.MapBffEndpoints();
app.MapReverseProxy();

app.Run();

public partial class Program;
