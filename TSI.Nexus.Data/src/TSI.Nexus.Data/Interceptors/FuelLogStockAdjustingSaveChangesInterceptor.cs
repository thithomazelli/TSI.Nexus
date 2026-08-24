using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Data.Interceptors
{
    /// <summary>
    /// Decrements Product.QuantityInStock, once, the moment a FuelLog's Status transitions into
    /// "Concluído" - the refueling counterpart to MaintenancePartsStockAdjustingSaveChangesInterceptor,
    /// debiting Liters from the single linked Product instead of summing an N-product grid. Status is
    /// a SelectableOptionGroup.FuelLogStatus value (plain string, not a C# enum), so the transition is
    /// a string comparison rather than an enum cast.
    /// </summary>
    public class FuelLogStockAdjustingSaveChangesInterceptor : SaveChangesInterceptor
    {
        private const string CompletedStatus = "Concluído";

        #region Public methods

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default
        )
        {
            var context = eventData.Context;
            if (context == null)
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var completedEntries = context
                .ChangeTracker.Entries<FuelLog>()
                .Where(e => e.State == EntityState.Modified)
                .Where(e =>
                {
                    var originalStatus = e.OriginalValues.Properties.Any(p => p.Name == "Status")
                        ? (string)e.OriginalValues["Status"]
                        : e.Entity.Status;
                    var currentStatus = e.CurrentValues.Properties.Any(p => p.Name == "Status")
                        ? (string)e.CurrentValues["Status"]
                        : e.Entity.Status;

                    return originalStatus != CompletedStatus && currentStatus == CompletedStatus;
                })
                .Select(e => e.Entity)
                .Where(f => f.ProductId.HasValue && f.Liters > 0)
                .ToList();

            if (!completedEntries.Any())
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var deltas = new Dictionary<Guid, int>();
            foreach (var fuelLog in completedEntries)
            {
                var qty = Convert.ToInt32(fuelLog.Liters);
                if (deltas.ContainsKey(fuelLog.ProductId!.Value))
                    deltas[fuelLog.ProductId!.Value] += qty;
                else
                    deltas[fuelLog.ProductId!.Value] = qty;
            }

            var productIds = deltas.Keys.ToList();
            var products = await context
                .Set<Product>()
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync(cancellationToken);

            foreach (var p in products)
            {
                var d = deltas.ContainsKey(p.Id) ? deltas[p.Id] : 0;
                if (d == 0)
                    continue;

                p.QuantityInStock -= d;
                context.Entry(p).Property("QuantityInStock").IsModified = true;
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        #endregion Public methods
    }
}
