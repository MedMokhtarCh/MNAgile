using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ProjectService.Data;
using ProjectService.Services;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Configuration du DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuration du HttpClient pour UserService
builder.Services.AddHttpClient<UserServiceClient>(client =>
{
    client.BaseAddress = new Uri("http://localhost:5203");
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator
});

// Ajout des services
builder.Services.AddScoped<ProjectService.Services.ProjectService>();
builder.Services.AddControllers();

// Configuration de Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ProjectService",
        Version = "v1",
        Description = "API for ProjectService"
    });
    c.CustomOperationIds(e => $"{e.ActionDescriptor.RouteValues["controller"]}_{e.HttpMethod}");
    c.AddServer(new OpenApiServer { Url = "http://localhost:5273" });
});

// Configuration du logging
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddConsole();
    loggingBuilder.AddDebug();
});

var app = builder.Build();

// Configuration de Swagger UI avec middleware pour forcer la version 3.0.3
if (app.Environment.IsDevelopment())
{
    app.UseSwagger(c =>
    {
        c.SerializeAsV2 = false; // Assurer OpenAPI 3.0
        c.PreSerializeFilters.Add((swaggerDoc, httpReq) =>
        {
            var originalJson = JsonSerializer.Serialize(swaggerDoc);
            var modifiedJson = originalJson.Replace("\"openapi\": \"3.0.4\"", "\"openapi\": \"3.0.3\"")
                                          .Replace("\"openapi\": \"3.0.0\"", "\"openapi\": \"3.0.3\"");
            swaggerDoc = JsonSerializer.Deserialize<OpenApiDocument>(modifiedJson);
        });
    });
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ProjectService v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();