using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;

            var logger = provider.GetService<ILoggerFactory>()?.CreateLogger("DatabaseSeeder");

            try
            {
                var userManager = provider.GetRequiredService<UserManager<User>>();
                var roleManager = provider.GetRequiredService<RoleManager<IdentityRole>>();

                // ensure roles
                var roles = new[] { "Admin", "User" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                    {
                        var roleResult = await roleManager.CreateAsync(new IdentityRole(role));
                        if (!roleResult.Succeeded)
                        {
                            logger?.LogError("Failed to create role '{Role}': {Errors}", role, string.Join(';', roleResult.Errors));
                        }
                        else
                        {
                            logger?.LogInformation("Role '{Role}' created", role);
                        }
                    }
                }

                // ensure admin user
                var adminUserName = "admin";
                var admin = await userManager.FindByNameAsync(adminUserName);
                if (admin == null)
                {
                    var year = DateTime.UtcNow.Year;
                    var password = $"tsi@{year}";

                    var user = new User
                    {
                        UserName = adminUserName,
                        Email = "admin@local",
                        EmailConfirmed = true,
                        FirstName = "Admin",
                        LastName = "User",
                    };

                    var result = await userManager.CreateAsync(user, password);
                    if (!result.Succeeded)
                    {
                        logger?.LogError(
                            "Failed to create admin user: {Errors}",
                            string.Join(';', result.Errors)
                        );
                    }
                    else
                    {
                        logger?.LogInformation(
                            "Admin user created with password 'tsi@{Year}'",
                            year
                        );

                        // assign admin role
                        var addRoleResult = await userManager.AddToRoleAsync(user, "Admin");
                        if (!addRoleResult.Succeeded)
                        {
                            logger?.LogError("Failed to add admin user to role 'Admin': {Errors}", string.Join(';', addRoleResult.Errors));
                        }
                    }
                }
                else
                {
                    logger?.LogInformation("Admin user already exists");

                    // ensure admin has Admin role
                    if (!await userManager.IsInRoleAsync(admin, "Admin"))
                    {
                        var addRoleResult = await userManager.AddToRoleAsync(admin, "Admin");
                        if (!addRoleResult.Succeeded)
                        {
                            logger?.LogError("Failed to add existing admin user to role 'Admin': {Errors}", string.Join(';', addRoleResult.Errors));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                var logger2 = services.GetService<ILoggerFactory>()?.CreateLogger("DatabaseSeeder");
                logger2?.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
