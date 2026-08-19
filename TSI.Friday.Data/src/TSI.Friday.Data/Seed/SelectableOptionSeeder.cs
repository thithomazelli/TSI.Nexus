using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data.Seed
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
        private static readonly (SelectableOptionGroup Group, string Value)[] DefaultOptions =
        [
            (SelectableOptionGroup.AddressType, "Residencial"),
            (SelectableOptionGroup.AddressType, "Comercial"),
            (SelectableOptionGroup.AddressType, "Correspondência"),
            (SelectableOptionGroup.AddressType, "Cobrança"),
            (SelectableOptionGroup.AddressType, "Entrega"),
            (SelectableOptionGroup.ProductCategory, "Elétrica"),
            (SelectableOptionGroup.ProductCategory, "Hidráulica"),
            (SelectableOptionGroup.ProductCategory, "Estrutura"),
            (SelectableOptionGroup.ProductCategory, "Drywall"),
            (SelectableOptionGroup.ProductCategory, "Pintura"),
            (SelectableOptionGroup.ProductCategory, "Acabamento"),
            (SelectableOptionGroup.ProductCategory, "Sanitário"),
            (SelectableOptionGroup.ProductCategory, "Equipamento"),
            (SelectableOptionGroup.ProductCategory, "Fixação"),
            (SelectableOptionGroup.TransactionCategory, "Combustível"),
            (SelectableOptionGroup.TransactionCategory, "Despesas Fixas"),
            (SelectableOptionGroup.TransactionCategory, "Despesas Variáveis"),
            (SelectableOptionGroup.TransactionCategory, "Despesas Veículos"),
            (SelectableOptionGroup.TransactionCategory, "Diversos"),
            (SelectableOptionGroup.TransactionCategory, "Funcionários"),
            (SelectableOptionGroup.TransactionCategory, "Recebimentos"),
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

                foreach (var (group, value) in DefaultOptions)
                {
                    var alreadyExists = await context.SelectableOption.AnyAsync(o =>
                        o.Group == group && o.Value == value
                    );
                    if (alreadyExists)
                    {
                        continue;
                    }

                    await context.SelectableOption.AddAsync(
                        new SelectableOption { Group = group, Value = value }
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
