using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using UserService.Data;
using UserService.Middleware;
using UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", // Frontend
                "http://localhost:5203", // UserService HTTP
                "https://localhost:7151"  // UserService HTTPS
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
           .AllowCredentials();
    });
});

// Configure DbContext with sensitive data logging
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
           .EnableSensitiveDataLogging() // Enable detailed error logging
           .EnableDetailedErrors());

// Register services
builder.Services.AddScoped<UserService.Services.UserService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddHttpContextAccessor();

// Configure JWT authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = true;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("SuperAdminOnly", policy => policy.RequireClaim("RoleId", "1"));
    options.AddPolicy("AdminOnly", policy => policy.RequireClaim("RoleId", "2"));
    options.AddPolicy("SuperAdminOrAdmin", policy => policy.RequireClaim("RoleId", "1", "2"));
    options.AddPolicy("CanViewUsers", policy => policy.RequireClaim("CanViewUsers"));
    options.AddPolicy("CanCreateUsers", policy => policy.RequireClaim("CanCreateUsers"));
    options.AddPolicy("CanUpdateUsers", policy => policy.RequireClaim("CanUpdateUsers"));
    options.AddPolicy("CanDeleteUsers", policy => policy.RequireClaim("CanDeleteUsers"));
    options.AddPolicy("CanViewProjects", policy => policy.RequireClaim("CanViewProjects"));
    options.AddPolicy("CanCreateProjects", policy => policy.RequireClaim("CanCreateProjects"));
    options.AddPolicy("CanUpdateProjects", policy => policy.RequireClaim("CanUpdateProjects"));
    options.AddPolicy("CanDeleteProjects", policy => policy.RequireClaim("CanDeleteProjects"));

    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "UserService API", Version = "v1" });

    // Add JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });

    // Add multiple server URLs
    c.AddServer(new OpenApiServer { Url = "https://localhost:7151" });
    c.AddServer(new OpenApiServer { Url = "http://localhost:5203" });
});

// Configure logging
builder.Services.AddLogging(loggingBuilder =>
{
    loggingBuilder.AddConsole();
    loggingBuilder.AddDebug();
    loggingBuilder.SetMinimumLevel(LogLevel.Debug); // Enable debug logs for troubleshooting
});

var app = builder.Build();

// Use CORS policy
app.UseCors("AllowFrontend");

// Middleware for exception handling
app.UseMiddleware<ExceptionMiddleware>();

// Seed database
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        dbContext.Database.Migrate(); // Apply migrations to ensure schema and HasData seeding
        DatabaseSeeder.SeedDatabase(dbContext); // Seed SuperAdmin
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Erreur lors de l'initialisation de la base de données: {ex.Message}");
        if (ex.InnerException != null)
        {
            Console.WriteLine($"Exception interne: {ex.InnerException.Message}");
        }
        throw; // Rethrow to make the error visible
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "UserService API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();