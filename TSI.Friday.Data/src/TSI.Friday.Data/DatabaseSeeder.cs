using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data
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
                    }
                }
                else
                {
                    logger?.LogInformation("Admin user already exists");
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
