using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data.Interceptors
{
    /// <summary>
    /// Adjusts Product.QuantityInStock when a VehicleMaintenance consumes a part from the
    /// almoxarifado - the same stock field already adjusted for client orders
    /// (StockAdjustingSaveChangesInterceptor), just triggered by internal maintenance consumption
    /// instead of a sale/rental.
    /// </summary>
    public class MaintenancePartsStockAdjustingSaveChangesInterceptor : SaveChangesInterceptor
    {
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

            var entries = context
                .ChangeTracker.Entries<VehicleMaintenance>()
                .Where(e =>
                    e.State == EntityState.Added
                    || e.State == EntityState.Modified
                    || e.State == EntityState.Deleted
                )
                .ToList();

            if (!entries.Any())
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var deltas = new Dictionary<Guid, int>();

            void Add(Guid? productId, int delta)
            {
                if (productId == null || productId == Guid.Empty || delta == 0)
                {
                    return;
                }
                deltas[productId.Value] = deltas.TryGetValue(productId.Value, out var current)
                    ? current + delta
                    : delta;
            }

            foreach (var entry in entries)
            {
                var maintenance = entry.Entity;

                if (entry.State == EntityState.Added)
                {
                    // consuming a part reduces stock
                    Add(maintenance.ProductId, -maintenance.PartQuantity);
                }
                else if (entry.State == EntityState.Deleted)
                {
                    var originalProductId = entry.OriginalValues.GetValue<Guid?>(
                        nameof(VehicleMaintenance.ProductId)
                    );
                    var originalQuantity = entry.OriginalValues.GetValue<int>(
                        nameof(VehicleMaintenance.PartQuantity)
                    );
                    // deleting the record returns the part to stock
                    Add(originalProductId, originalQuantity);
                }
                else if (entry.State == EntityState.Modified)
                {
                    var originalProductId = entry.OriginalValues.GetValue<Guid?>(
                        nameof(VehicleMaintenance.ProductId)
                    );
                    var originalQuantity = entry.OriginalValues.GetValue<int>(
                        nameof(VehicleMaintenance.PartQuantity)
                    );

                    if (originalProductId != maintenance.ProductId)
                    {
                        // part changed: return the original reservation, consume from the new one
                        Add(originalProductId, originalQuantity);
                        Add(maintenance.ProductId, -maintenance.PartQuantity);
                    }
                    else
                    {
                        var quantityDelta = originalQuantity - maintenance.PartQuantity;
                        Add(maintenance.ProductId, quantityDelta);
                    }
                }
            }

            if (deltas.Any())
            {
                var productIds = deltas.Keys.ToList();
                var products = await context
                    .Set<Product>()
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync(cancellationToken);

                foreach (var product in products)
                {
                    var delta = deltas.TryGetValue(product.Id, out var d) ? d : 0;
                    if (delta != 0)
                    {
                        product.QuantityInStock += delta;
                        context.Entry(product).Property(p => p.QuantityInStock).IsModified = true;
                    }
                }
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
