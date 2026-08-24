using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Data.Seed
{
    /// <summary>
    /// Populates the default values for the app's admin-editable dropdown option lists
    /// (address type, product category, transaction category) the first time it runs against a
    /// database that doesn't have them yet, and - since Address.Type and Product.Category used to
    /// store the English option key rather than its Portuguese label - rewrites any existing rows
    /// still holding one of those old keys to the new label so they keep matching a real option.
    /// Transaction/Payment.Category already stored the Portuguese label directly, so no rewrite is
    /// needed there. This seeder only ever inserts missing options - it never overwrites one an
    /// Admin has already edited or removed.
    /// </summary>
    public static class SelectableOptionSeeder
    {
        private static readonly (SelectableOptionGroup Group, string Value, string? Color)[] DefaultOptions =
        [
            (SelectableOptionGroup.AddressType, "Residencial", null),
            (SelectableOptionGroup.AddressType, "Comercial", null),
            (SelectableOptionGroup.AddressType, "Correspondência", null),
            (SelectableOptionGroup.AddressType, "Cobrança", null),
            (SelectableOptionGroup.AddressType, "Entrega", null),
            (SelectableOptionGroup.ProductCategory, "Elétrica", null),
            (SelectableOptionGroup.ProductCategory, "Hidráulica", null),
            (SelectableOptionGroup.ProductCategory, "Estrutura", null),
            (SelectableOptionGroup.ProductCategory, "Drywall", null),
            (SelectableOptionGroup.ProductCategory, "Pintura", null),
            (SelectableOptionGroup.ProductCategory, "Acabamento", null),
            (SelectableOptionGroup.ProductCategory, "Sanitário", null),
            (SelectableOptionGroup.ProductCategory, "Equipamento", null),
            (SelectableOptionGroup.ProductCategory, "Fixação", null),
            (SelectableOptionGroup.TransactionCategory, "Combustível", null),
            (SelectableOptionGroup.TransactionCategory, "Despesas Fixas", null),
            (SelectableOptionGroup.TransactionCategory, "Despesas Variáveis", null),
            (SelectableOptionGroup.TransactionCategory, "Despesas Veículos", null),
            (SelectableOptionGroup.TransactionCategory, "Diversos", null),
            (SelectableOptionGroup.TransactionCategory, "Funcionários", null),
            (SelectableOptionGroup.TransactionCategory, "Recebimentos", null),
            (SelectableOptionGroup.FuelLogStatus, "Agendado", null),
            (SelectableOptionGroup.FuelLogStatus, "Cancelado", null),
            (SelectableOptionGroup.FuelLogStatus, "Concluído", null),
            (SelectableOptionGroup.EventType, "Reunião", "#3788d8"),
            (SelectableOptionGroup.EventType, "Prazo", "#e63757"),
            (SelectableOptionGroup.EventType, "Lembrete", "#f5a623"),
            (SelectableOptionGroup.EventType, "Aniversário", "#8e44ad"),
            (SelectableOptionGroup.EventType, "Outro", "#6c757d"),
        ];

        // Old English key -> new Portuguese label, for the two groups that used to store the key.
        private static readonly Dictionary<string, string> LegacyAddressTypeLabels = new()
        {
            ["Home"] = "Residencial",
            ["Office"] = "Comercial",
            ["Postal"] = "Correspondência",
            ["Mailing"] = "Correspondência",
            ["Billing"] = "Cobrança",
            ["Shipping"] = "Entrega",
        };

        private static readonly Dictionary<string, string> LegacyProductCategoryLabels = new()
        {
            ["Electric"] = "Elétrica",
            ["Hydraulics"] = "Hidráulica",
            ["Structure"] = "Estrutura",
            ["Drywall"] = "Drywall",
            ["Painting"] = "Pintura",
            ["Finishing"] = "Acabamento",
            ["Finish"] = "Acabamento",
            ["Sanitary"] = "Sanitário",
            ["Equipment"] = "Equipamento",
            ["Fixing"] = "Fixação",
        };

        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;
            var logger = provider.GetService<ILoggerFactory>()?.CreateLogger("SelectableOptionSeeder");

            try
            {
                var context = provider.GetRequiredService<MyDBContextEF>();

                foreach (var (group, value, color) in DefaultOptions)
                {
                    var alreadyExists = await context.SelectableOption.AnyAsync(o =>
                        o.Group == group && o.Value == value
                    );
                    if (alreadyExists)
                    {
                        continue;
                    }

                    await context.SelectableOption.AddAsync(
                        new SelectableOption { Group = group, Value = value, Color = color }
                    );
                    logger?.LogInformation(
                        "SelectableOptionSeeder: created default option {Group}/{Value}",
                        group,
                        value
                    );
                }

                await context.SaveChangesAsync();

                foreach (var (legacyKey, label) in LegacyAddressTypeLabels)
                {
                    await context
                        .Address.Where(a => a.Type == legacyKey)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(a => a.Type, label));
                }

                foreach (var (legacyKey, label) in LegacyProductCategoryLabels)
                {
                    await context
                        .Product.Where(p => p.Category == legacyKey)
                        .ExecuteUpdateAsync(setters => setters.SetProperty(p => p.Category, label));
                }
            }
            catch (Exception ex)
            {
                logger?.LogError(ex, "An error occurred while seeding the default selectable options.");
            }
        }
    }
}
