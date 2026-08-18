using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
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
                var roleManager = provider.GetRequiredService<RoleManager<IdentityRole>>();

                // ensure roles
                var roles = new[] { "Master", "Admin", "User" };
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

                // Ensure initial users: Admin (Master role) plus the named Admin-role accounts.
                // UserName always equals Email, except "admin" itself: it's a technical/system
                // account with no real mailbox, so its "email" is just the literal string "admin".
                var year = DateTime.UtcNow.Year;
                var initialUsers = new[]
                {
                    (
                        UserName: "admin",
                        Email: "admin",
                        FirstName: "Admin",
                        LastName: "",
                        Role: "Master",
                        Password: $"!tsi@{year}",
                        // Earlier seed revisions created this account as "Admin" or "admin@local".
                        LegacyUserNames: new[] { "Admin", "admin@local" }
                    ),
                    (
                        UserName: "thiago.thomazelli@gmail.com",
                        Email: "thiago.thomazelli@gmail.com",
                        FirstName: "Thiago",
                        LastName: "Thomazelli",
                        Role: "Admin",
                        Password: $"tsi@{year}",
                        // Earlier seed revisions created this account as "Thiago" with password "tsi".
                        LegacyUserNames: new[] { "Thiago" }
                    ),
                    (
                        UserName: "leonardothomazellif@gmail.com",
                        Email: "leonardothomazellif@gmail.com",
                        FirstName: "Leonardo",
                        LastName: "Thomazelli",
                        Role: "Admin",
                        Password: $"tsi@{year}",
                        // Earlier seed revisions created this account as "Leonardo" with password "tsi".
                        LegacyUserNames: new[] { "Leonardo" }
                    ),
                };

                foreach (var initialUser in initialUsers)
                {
                    var existing = await userManager.FindByNameAsync(initialUser.UserName);

                    // One-time migration: find an account created under an earlier seed revision's
                    // username so it gets renamed/repaired in place instead of duplicated. Once
                    // renamed, the lookup above matches directly on future runs and this is skipped
                    // -- so a password the person later changes themselves is never touched again.
                    var isMigration = false;
                    if (existing == null)
                    {
                        foreach (var legacyUserName in initialUser.LegacyUserNames)
                        {
                            existing = await userManager.FindByNameAsync(legacyUserName);
                            if (existing != null)
                            {
                                isMigration = true;
                                break;
                            }
                        }
                    }

                    if (existing == null)
                    {
                        var user = new User
                        {
                            UserName = initialUser.UserName,
                            Email = initialUser.Email,
                            EmailConfirmed = true,
                            FirstName = initialUser.FirstName,
                            LastName = initialUser.LastName,
                        };

                        var result = await userManager.CreateAsync(user, initialUser.Password);
                        if (!result.Succeeded)
                        {
                            logger?.LogError(
                                "Failed to create user '{UserName}': {Errors}",
                                initialUser.UserName,
                                string.Join(';', result.Errors)
                            );
                            continue;
                        }

                        logger?.LogInformation("User '{UserName}' created", initialUser.UserName);

                        var addRoleResult = await userManager.AddToRoleAsync(user, initialUser.Role);
                        if (!addRoleResult.Succeeded)
                        {
                            logger?.LogError(
                                "Failed to add user '{UserName}' to role '{Role}': {Errors}",
                                initialUser.UserName,
                                initialUser.Role,
                                string.Join(';', addRoleResult.Errors)
                            );
                        }
                    }
                    else if (isMigration)
                    {
                        var setUserNameResult = await userManager.SetUserNameAsync(
                            existing,
                            initialUser.UserName
                        );
                        var setEmailResult = await userManager.SetEmailAsync(
                            existing,
                            initialUser.Email
                        );
                        existing.EmailConfirmed = true;
                        var updateResult = await userManager.UpdateAsync(existing);

                        if (await userManager.HasPasswordAsync(existing))
                        {
                            await userManager.RemovePasswordAsync(existing);
                        }
                        var addPasswordResult = await userManager.AddPasswordAsync(
                            existing,
                            initialUser.Password
                        );

                        if (
                            !setUserNameResult.Succeeded
                            || !setEmailResult.Succeeded
                            || !updateResult.Succeeded
                            || !addPasswordResult.Succeeded
                        )
                        {
                            logger?.LogError(
                                "Failed to migrate legacy user onto '{UserName}'",
                                initialUser.UserName
                            );
                        }
                        else
                        {
                            logger?.LogInformation(
                                "Migrated legacy user onto '{UserName}'",
                                initialUser.UserName
                            );
                        }

                        if (!await userManager.IsInRoleAsync(existing, initialUser.Role))
                        {
                            var addRoleResult = await userManager.AddToRoleAsync(
                                existing,
                                initialUser.Role
                            );
                            if (!addRoleResult.Succeeded)
                            {
                                logger?.LogError(
                                    "Failed to add migrated user '{UserName}' to role '{Role}': {Errors}",
                                    initialUser.UserName,
                                    initialUser.Role,
                                    string.Join(';', addRoleResult.Errors)
                                );
                            }
                        }
                    }
                    else
                    {
                        logger?.LogInformation("User '{UserName}' already exists", initialUser.UserName);

                        if (!await userManager.IsInRoleAsync(existing, initialUser.Role))
                        {
                            var addRoleResult = await userManager.AddToRoleAsync(existing, initialUser.Role);
                            if (!addRoleResult.Succeeded)
                            {
                                logger?.LogError(
                                    "Failed to add existing user '{UserName}' to role '{Role}': {Errors}",
                                    initialUser.UserName,
                                    initialUser.Role,
                                    string.Join(';', addRoleResult.Errors)
                                );
                            }
                        }
                    }
                }

                // ensure the fleet module feature toggle exists. Enabled by default, so this
                // never changes the behaviour of a database that already has real fleet data.
                var context = provider.GetRequiredService<MyDBContextEF>();
                var fleetModuleExists = await context.FeatureToggle.AnyAsync(f =>
                    f.Key == FeatureToggleKeys.FleetModule
                );
                if (!fleetModuleExists)
                {
                    await context.FeatureToggle.AddAsync(
                        new FeatureToggle
                        {
                            Key = FeatureToggleKeys.FleetModule,
                            Name = "Módulo de Frota / Viagens",
                            Description =
                                "Controla a exibição de Viagens, Veículos, Motoristas, Ordens de Serviço e demais dados de frota em todo o sistema.",
                            Enabled = true,
                        }
                    );
                    await context.SaveChangesAsync();
                    logger?.LogInformation("FeatureToggle 'FleetModule' created (enabled)");
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
