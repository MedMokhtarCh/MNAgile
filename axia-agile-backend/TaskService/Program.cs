using System.Text;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using TaskService.Data;
using TaskService.Services;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAllOrigins", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:5273")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});


builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddHttpClient<ProjectServiceClient>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["ProjectService:BaseUrl"]);
});
builder.Services.AddControllers();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<TaskService.Services.TaskService>();
builder.Services.AddScoped<UserServiceClient>();
builder.Services.AddScoped<ProjectServiceClient>();
builder.Services.AddScoped<FileStorageService>();
builder.Services.AddScoped<KanbanColumnService>();
builder.Services.AddScoped<BacklogService>();
builder.Services.AddScoped<SprintService>();


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
    options.RequireHttpsMetadata = false;
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
            string authHeader = context.Request.Headers["Authorization"];
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                context.Token = authHeader.Substring("Bearer ".Length).Trim();
                context.HttpContext.RequestServices.GetService<ILogger<Program>>()
                    ?.LogDebug("JWT token extracted from Authorization header");
            }
            else if (context.Request.Cookies.ContainsKey("AuthToken"))
            {
                context.Token = context.Request.Cookies["AuthToken"];
                context.HttpContext.RequestServices.GetService<ILogger<Program>>()
                    ?.LogDebug("JWT token extracted from AuthToken cookie");
            }
            else
            {
                context.HttpContext.RequestServices.GetService<ILogger<Program>>()
                    ?.LogWarning("No JWT token found in Authorization header or AuthToken cookie.");
            }
            return Task.CompletedTask;
        },
        OnAuthenticationFailed = context =>
        {
            context.HttpContext.RequestServices.GetService<ILogger<Program>>()
                ?.LogError("Authentication failed: {Error}", context.Exception.Message);
            return Task.CompletedTask;
        },
        OnTokenValidated = context =>
        {
            context.HttpContext.RequestServices.GetService<ILogger<Program>>()
                ?.LogInformation("Token validated successfully");
            return Task.CompletedTask;
        }
    };
})
.AddCookie(CookieAuthenticationDefaults.AuthenticationScheme, options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.LoginPath = "/api/auth/login";
    options.ExpireTimeSpan = TimeSpan.FromHours(1);
});

// Authorization 
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("CanViewTasks", policy => policy.RequireClaim("CanViewTasks", "true"));
    options.AddPolicy("CanCreateTasks", policy => policy.RequireClaim("CanCreateTasks", "true"));
    options.AddPolicy("CanUpdateTasks", policy => policy.RequireClaim("CanUpdateTasks", "true"));
    options.AddPolicy("CanDeleteTasks", policy => policy.RequireClaim("CanDeleteTasks", "true"));
    options.AddPolicy("CanMoveTasks", policy => policy.RequireClaim("CanMoveTasks"));
    // Backlog Policies
    options.AddPolicy("CanViewBacklogs", policy => policy.RequireClaim("CanViewBacklogs", "true"));
    options.AddPolicy("CanCreateBacklogs", policy => policy.RequireClaim("CanCreateBacklogs", "true"));
    options.AddPolicy("CanUpdateBacklogs", policy => policy.RequireClaim("CanUpdateBacklogs", "true"));
    options.AddPolicy("CanDeleteBacklogs", policy => policy.RequireClaim("CanDeleteBacklogs", "true"));

    // Sprint Policies
    options.AddPolicy("CanViewSprints", policy => policy.RequireClaim("CanViewSprints", "true"));
    options.AddPolicy("CanCreateSprints", policy => policy.RequireClaim("CanCreateSprints", "true"));
    options.AddPolicy("CanUpdateSprints", policy => policy.RequireClaim("CanUpdateSprints", "true"));
    options.AddPolicy("CanDeleteSprints", policy => policy.RequireClaim("CanDeleteSprints", "true"));
    //  Kanban column policies
    options.AddPolicy("CanCreateKanbanColumns", policy => policy.RequireClaim("CanCreateKanbanColumns", "true"));
    options.AddPolicy("CanUpdateKanbanColumns", policy => policy.RequireClaim("CanUpdateKanbanColumns", "true"));
    options.AddPolicy("CanDeleteKanbanColumns", policy => policy.RequireClaim("CanDeleteKanbanColumns", "true"));
    options.DefaultPolicy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "TaskService API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
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
});


builder.Services.AddLogging(logging =>
{
    logging.AddConsole();
    logging.AddDebug();
    logging.SetMinimumLevel(LogLevel.Debug);
});



var app = builder.Build();


var uploadsDirectory = Path.Combine(app.Environment.WebRootPath ?? "wwwroot", "Uploads");
if (!Directory.Exists(uploadsDirectory))
{
    Directory.CreateDirectory(uploadsDirectory);
}


if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Docker"))
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseDeveloperExceptionPage();
}

app.UseCors("AllowAllOrigins");
app.UseStaticFiles();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();


app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetService<ILogger<Program>>();
    logger?.LogInformation("Handling request: {Method} {Path}", context.Request.Method, context.Request.Path);
    await next.Invoke();
    logger?.LogInformation("Finished handling request: {StatusCode}", context.Response.StatusCode);
});

app.Run();