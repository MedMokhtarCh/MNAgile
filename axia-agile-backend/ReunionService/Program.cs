using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ReunionService.Data;
using ReunionService.Middleware;
using ReunionService.Services;
using System.Text;
using Google.Apis.Auth.OAuth2;
using Google.Apis.Meet.v2;
using Google.Apis.Calendar.v3;
using Google.Apis.Services;
using Microsoft.AspNetCore.Authorization;
using System.IO;

var builder = WebApplication.CreateBuilder(args);

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Configure DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register services
builder.Services.AddScoped<ReunionService.Services.ReunionService>();
builder.Services.AddHttpContextAccessor();

// Configure JWT authentication
var jwtSettings = builder.Configuration.GetSection("Jwt");
var keyValue = jwtSettings["Key"] ?? Environment.GetEnvironmentVariable("JWT_KEY");
if (string.IsNullOrEmpty(keyValue))
{
    throw new InvalidOperationException("JWT Key is not configured.");
}
var key = Encoding.ASCII.GetBytes(keyValue);
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
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var token = context.Request.Cookies["AuthToken"];
            if (string.IsNullOrEmpty(token))
            {
                var authHeader = context.Request.Headers["Authorization"];
                if (!string.IsNullOrEmpty(authHeader))
                {
                    token = authHeader.ToString().Replace("Bearer ", "").Trim();
                }
            }
            if (!string.IsNullOrEmpty(token))
            {
                context.Token = token;
            }
            return Task.CompletedTask;
        }
    };
});

// Configure authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanCreateMeetings", policy => policy.RequireAuthenticatedUser());
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

// Configure Google Meet and Calendar Services with service account
builder.Services.AddScoped<MeetService>(provider =>
{
    var logger = provider.GetRequiredService<ILogger<Program>>();
    var serviceAccountKeyPath = Path.Combine(AppContext.BaseDirectory, builder.Configuration["Google:ServiceAccountKeyPath"]);
    if (string.IsNullOrEmpty(serviceAccountKeyPath) || !File.Exists(serviceAccountKeyPath))
    {
        logger.LogError("Service account key file is missing or not configured at path: {serviceAccountKeyPath}", serviceAccountKeyPath);
        throw new InvalidOperationException($"Service account key file is missing or not configured at path: {serviceAccountKeyPath}");
    }

    var credential = GoogleCredential.FromFile(serviceAccountKeyPath)
        .CreateScoped(new[] {
            "https://www.googleapis.com/auth/meetings.space.created",
            "https://www.googleapis.com/auth/calendar.events"
        });

    logger.LogInformation("Google Meet service initialized with service account from {serviceAccountKeyPath}", serviceAccountKeyPath);

    return new MeetService(new BaseClientService.Initializer
    {
        HttpClientInitializer = credential,
        ApplicationName = "ReunionService"
    });
});

// Configure Google Meet and Calendar Services with service account
builder.Services.AddScoped<MeetService>(provider =>
{
    var logger = provider.GetRequiredService<ILogger<Program>>();
    var serviceAccountKeyPath = Path.Combine(AppContext.BaseDirectory, builder.Configuration["Google:ServiceAccountKeyPath"]);
    if (string.IsNullOrEmpty(serviceAccountKeyPath) || !File.Exists(serviceAccountKeyPath))
    {
        logger.LogError("Service account key file is missing or not configured at path: {serviceAccountKeyPath}", serviceAccountKeyPath);
        throw new InvalidOperationException($"Service account key file is missing or not configured at path: {serviceAccountKeyPath}");
    }

    var credential = GoogleCredential.FromFile(serviceAccountKeyPath)
        .CreateScoped(new[] {
            "https://www.googleapis.com/auth/meetings.space.created",
            "https://www.googleapis.com/auth/calendar.events"
        });

    logger.LogInformation("Google Meet service initialized with service account from {serviceAccountKeyPath}", serviceAccountKeyPath);

    return new MeetService(new BaseClientService.Initializer
    {
        HttpClientInitializer = credential,
        ApplicationName = "ReunionService"
    });
});

builder.Services.AddScoped<CalendarService>(provider =>
{
    var logger = provider.GetRequiredService<ILogger<Program>>();
    var serviceAccountKeyPath = Path.Combine(AppContext.BaseDirectory, builder.Configuration["Google:ServiceAccountKeyPath"]);
    if (string.IsNullOrEmpty(serviceAccountKeyPath) || !File.Exists(serviceAccountKeyPath))
    {
        logger.LogError("Service account key file is missing or not configured at path: {serviceAccountKeyPath}", serviceAccountKeyPath);
        throw new InvalidOperationException($"Service account key file is missing or not configured at path: {serviceAccountKeyPath}");
    }

    var credential = GoogleCredential.FromFile(serviceAccountKeyPath)
        .CreateScoped(new[] {
            "https://www.googleapis.com/auth/meetings.space.created",
            "https://www.googleapis.com/auth/calendar.events"
        });

    logger.LogInformation("Google Calendar service initialized with service account from {serviceAccountKeyPath}", serviceAccountKeyPath);

    return new CalendarService(new BaseClientService.Initializer
    {
        HttpClientInitializer = credential,
        ApplicationName = "ReunionService"
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ReunionService API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header,
        Description = "Please enter JWT with Bearer into field",
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
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
            Array.Empty<string>()
        }
    });

    c.AddServer(new OpenApiServer { Url = "https://localhost:7289" });
});

var app = builder.Build();

// Use CORS
app.UseCors("AllowFrontend");

// Middleware for exception handling
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "ReunionService API v1");
    });
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();