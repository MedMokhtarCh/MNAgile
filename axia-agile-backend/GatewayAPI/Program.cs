using Ocelot.DependencyInjection;
using Ocelot.Middleware;

var builder = WebApplication.CreateBuilder(args);


builder.Configuration.AddJsonFile("ocelot.json");
builder.Services.AddOcelot();


builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "GatewayAPI", Version = "v1" });
});

var app = builder.Build();


app.UseSwagger();
app.UseSwaggerUI(c =>
{

    c.SwaggerEndpoint("/swagger/users/v1/swagger.json", "UserService v1");
    c.SwaggerEndpoint("/swagger/projects/v1/swagger.json", "ProjectService v1");
});


await app.UseOcelot();

app.Run();