using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Data.Interceptors
{
    /// <summary>
    /// Increments Product.QuantityInStock, once, the moment a PurchaseOrder's Status transitions
    /// into Closed - the counterpart to StockAdjustingSaveChangesInterceptor, which decrements
    /// stock per sale line instead of per closed order. Kept as its own interceptor rather than a
    /// branch inside the sales one because the trigger (order-closed vs item-added) and the
    /// direction (increment vs decrement) are genuinely different mechanisms, not a parameter of
    /// the same one.
    /// </summary>
    public class PurchaseOrderStockIncrementingSaveChangesInterceptor : SaveChangesInterceptor
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

            var closedPurchaseOrderIds = context
                .ChangeTracker.Entries<PurchaseOrder>()
                .Where(e => e.State == EntityState.Modified)
                .Where(e =>
                {
                    var originalStatus = e.OriginalValues.Properties.Any(p => p.Name == "Status")
                        ? (OrderStatus)e.OriginalValues["Status"]
                        : e.Entity.Status;
                    var currentStatus = e.CurrentValues.Properties.Any(p => p.Name == "Status")
                        ? (OrderStatus)e.CurrentValues["Status"]
                        : e.Entity.Status;

                    return originalStatus != OrderStatus.Closed
                        && currentStatus == OrderStatus.Closed;
                })
                .Select(e => e.Entity.Id)
                .ToList();

            if (!closedPurchaseOrderIds.Any())
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            var lines = await context
                .Set<PurchaseOrderProduct>()
                .Where(pop => closedPurchaseOrderIds.Contains(pop.PurchaseOrderId))
                .Select(pop => new { pop.ProductId, pop.Quantity })
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
                    if (p.Type != ProductType.Sale && p.Type != ProductType.Rental)
                        continue;

                    var d = deltas.ContainsKey(p.Id) ? deltas[p.Id] : 0;
                    if (d == 0)
                        continue;

                    p.QuantityInStock += d;
                    context.Entry(p).Property("QuantityInStock").IsModified = true;
                }
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        #endregion Public methods
    }
}
