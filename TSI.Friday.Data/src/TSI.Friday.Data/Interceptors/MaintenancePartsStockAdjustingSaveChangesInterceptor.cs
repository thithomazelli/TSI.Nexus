using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data.Interceptors
{
    /// <summary>
    /// Decrements Product.QuantityInStock, once, the moment a VehicleMaintenance's Status
    /// transitions into Completed - the maintenance counterpart to
    /// PurchaseOrderStockIncrementingSaveChangesInterceptor, summing the parts staged in
    /// VehicleMaintenanceProducts instead of a single Product/PartQuantity pair.
    /// </summary>
    public class MaintenancePartsStockAdjustingSaveChangesInterceptor : SaveChangesInterceptor
    {
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

            var completedMaintenanceIds = context
                .ChangeTracker.Entries<VehicleMaintenance>()
                .Where(e => e.State == EntityState.Modified)
                .Where(e =>
                {
                    var originalStatus = e.OriginalValues.Properties.Any(p => p.Name == "Status")
                        ? (MaintenanceStatus)e.OriginalValues["Status"]
                        : e.Entity.Status;
                    var currentStatus = e.CurrentValues.Properties.Any(p => p.Name == "Status")
                        ? (MaintenanceStatus)e.CurrentValues["Status"]
                        : e.Entity.Status;

                    return originalStatus != MaintenanceStatus.Completed
                        && currentStatus == MaintenanceStatus.Completed;
                })
                .Select(e => e.Entity.Id)
                .ToList();

            if (!completedMaintenanceIds.Any())
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var lines = await context
                .Set<VehicleMaintenanceProduct>()
                .Where(vmp => completedMaintenanceIds.Contains(vmp.VehicleMaintenanceId))
                .Select(vmp => new { vmp.ProductId, vmp.Quantity })
                .ToListAsync(cancellationToken);

            var deltas = new Dictionary<Guid, int>();
            foreach (var line in lines)
            {
                var qty = Convert.ToInt32(line.Quantity);
                if (deltas.ContainsKey(line.ProductId))
                    deltas[line.ProductId] += qty;
                else
                    deltas[line.ProductId] = qty;
            }

            if (deltas.Any())
            {
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
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        #endregion Public methods
    }
}
