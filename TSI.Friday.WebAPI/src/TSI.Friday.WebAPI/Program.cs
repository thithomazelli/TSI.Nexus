using System;
using System.IO;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data;
using TSI.Friday.Data.Interceptors;
using TSI.Friday.IoC;
using TSI.Friday.Services.BackgroundServices;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder
    .Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Register HttpContext accessor and current user service
builder.Services.AddHttpContextAccessor();

// Register Services from Native Injector
NativeInjector.RegisterServices(builder.Services);

// Register background service from Services project
builder.Services.AddHostedService<OverdueStatusBackgroundService>();

// Add DbContext with interceptor
builder.Services.AddDbContextPool<MyDBContextEF>(
    (sp, options) =>
    {
        var mySqlConnectionStr = builder.Configuration.GetConnectionString("DefaultConnection");
        options.UseMySQL(mySqlConnectionStr);
        options.AddInterceptors(sp.GetRequiredService<AuditingSaveChangesInterceptor>());
        options.AddInterceptors(sp.GetRequiredService<StockAdjustingSaveChangesInterceptor>());
    }
);

// set default overdue interval if not present
builder.Configuration["OverdueCheckIntervalSeconds"] ??= "60";

// Configure Indentity core
builder
    .Services.AddIdentityCore<User>(options =>
    {
        // Password config
        options.Password.RequiredLength = 6;
        options.Password.RequireDigit = false;
        options.Password.RequireLowercase = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireNonAlphanumeric = false;

        // Sign In config
        options.SignIn.RequireConfirmedEmail = true;
    })
    .AddRoles<IdentityRole>() // be able to add roles
    .AddEntityFrameworkStores<MyDBContextEF>() // providing our context
    .AddRoleManager<RoleManager<IdentityRole>>() // be able to make use of RoleManager
    .AddSignInManager<SignInManager<User>>() // make use of Signin manager
    .AddUserManager<UserManager<User>>() // make use of UserManager to create new users
    .AddDefaultTokenProviders(); // be able to reate tokens for email confirmations

builder
    .Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // validate the token based on the key we have provided inside appsetting
            ValidateIssuerSigningKey = true,
            // the issuer singning key based on JWT:Key
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"])
            ),
            // the issuer which in here is the api project url
            ValidIssuer = builder.Configuration["JWT:Issuer"],
            // validate the issuer (who ever is issuing the JWT)
            ValidateIssuer = true,
            // don't validate audience (angular side)
            ValidateAudience = false,
            // ensure role claims are read from ClaimTypes.Role
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
        };
    });

// Add authorization policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
});

builder.Services.AddCors();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = actionContext =>
    {
        var errors = actionContext
            .ModelState.Where(_ => _.Value.Errors.Count > 0)
            .SelectMany(_ => _.Value.Errors)
            .Select(_ => _.ErrorMessage)
            .ToArray();

        var toReturn = new { Errors = errors };

        return new BadRequestObjectResult(toReturn);
    };
});

var app = builder.Build();

// Seed database
try
{
    DatabaseSeeder.SeedAsync(app.Services).GetAwaiter().GetResult();
}
catch
{
    // swallow to not break startup
}

// Resolve uploads path: configuration > workspace-root (dev) > ContentRoot (server)
string? configuredUploads = builder.Configuration["Uploads:Path"];
string uploadsPath;
if (!string.IsNullOrWhiteSpace(configuredUploads))
{
    // if relative path provided, resolve against content root
    if (Path.IsPathRooted(configuredUploads))
    {
        uploadsPath = Path.GetFullPath(configuredUploads);
    }
    else
    {
        uploadsPath = Path.GetFullPath(
            Path.Combine(app.Environment.ContentRootPath, configuredUploads)
        );
    }
}
else
{
    // detect workspace root for dev
    static string? FindWorkspaceRoot(string startPath)
    {
        try
        {
            var dir = new DirectoryInfo(startPath);
            while (dir != null && dir.FullName != dir.Root.FullName)
            {
                if (
                    Directory.Exists(Path.Combine(dir.FullName, ".git"))
                    || dir.GetFiles("*.sln").Any()
                    || string.Equals(dir.Name, "TSI.Friday", StringComparison.OrdinalIgnoreCase)
                )
                {
                    return dir.FullName;
                }
                dir = dir.Parent;
            }
        }
        catch
        {
            // ignore and fallback
        }

        return null;
    }

    var workspaceRoot = FindWorkspaceRoot(app.Environment.ContentRootPath);
    if (!string.IsNullOrWhiteSpace(workspaceRoot))
    {
        uploadsPath = Path.GetFullPath(Path.Combine(workspaceRoot, "uploads"));
    }
    else
    {
        // if workspace root not found, create uploads folder under ContentRootPath (app root)
        uploadsPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "uploads"));
    }
}

Directory.CreateDirectory(uploadsPath);
var uploadsProvider = new PhysicalFileProvider(uploadsPath);
app.UseStaticFiles(
    new StaticFileOptions { FileProvider = uploadsProvider, RequestPath = "/uploads" }
);

// Optionally enable directory browsing in development
if (app.Environment.IsDevelopment())
{
    app.UseDirectoryBrowser(
        new DirectoryBrowserOptions { FileProvider = uploadsProvider, RequestPath = "/uploads" }
    );
}

// Configure the HTTP request pipeline.
app.UseCors(opt =>
    opt.AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()
        .WithOrigins(builder.Configuration["JWT:ClientUrl"])
);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// adding UseAuthentication into our pipeline and this should come before UseAuthorization
// Authentication verifies the identity of a user or service, and authorization determines their access rights.
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
