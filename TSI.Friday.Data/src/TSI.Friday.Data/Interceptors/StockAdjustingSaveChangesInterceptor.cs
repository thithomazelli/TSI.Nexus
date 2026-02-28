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
    public class StockAdjustingSaveChangesInterceptor : SaveChangesInterceptor
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

            // Collect OrderProduct changes
            var entries = context
                .ChangeTracker.Entries()
                .Where(e =>
                    e.Entity is OrderProduct
                    && (
                        e.State == EntityState.Added
                        || e.State == EntityState.Modified
                        || e.State == EntityState.Deleted
                    )
                )
                .ToList();

            if (!entries.Any())
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            // accumulate deltas per productId (delta to be added to Product.QuantityInStock)
            var deltas = new Dictionary<Guid, int>();

            foreach (var entry in entries)
            {
                var op = (OrderProduct)entry.Entity;

                Guid productId;
                int originalQty = 0;
                int currentQty = 0;

                // ProductId might be present in current values or original values
                if (entry.Properties.Any(p => p.Metadata.Name == "ProductId"))
                {
                    productId = entry.Property("ProductId").CurrentValue is Guid g
                        ? g
                        : (entry.Property("ProductId").OriginalValue is Guid og ? og : Guid.Empty);
                }
                else
                {
                    // fallback to navigation
                    productId = op.ProductId;
                }

                // read quantities
                if (entry.State == EntityState.Added)
                {
                    currentQty = Convert.ToInt32(entry.CurrentValues["Quantity"] ?? op.Quantity);

                    // If the added order item already arrives as Returned, do not change stock
                    OrderProductStatus addedStatus = op.Status;
                    if (entry.CurrentValues.Properties.Any(p => p.Name == "Status"))
                    {
                        var statusObj = entry.CurrentValues["Status"];
                        if (statusObj != null)
                        {
                            addedStatus = (OrderProductStatus)Convert.ToInt32(statusObj);
                        }
                    }

                    // adding an order item reserves stock -> decrease stock, except when already Returned
                    if (addedStatus != OrderProductStatus.Returned)
                    {
                        AddDelta(deltas, productId, -currentQty);
                    }
                }
                else if (entry.State == EntityState.Deleted)
                {
                    originalQty = Convert.ToInt32(entry.OriginalValues["Quantity"] ?? op.Quantity);
                    // removing an order item returns stock
                    AddDelta(deltas, productId, originalQty);
                }
                else if (entry.State == EntityState.Modified)
                {
                    // Try to get original values; if not present (detached scenarios) fall back to database values
                    var dbValues = await entry.GetDatabaseValuesAsync(cancellationToken);

                    var origQtyObj = entry.OriginalValues.Properties.Any(p => p.Name == "Quantity")
                        ? entry.OriginalValues["Quantity"]
                        : dbValues? ["Quantity"];

                    var currQtyObj = entry.CurrentValues.Properties.Any(p => p.Name == "Quantity")
                        ? entry.CurrentValues["Quantity"]
                        : op.Quantity;

                    originalQty = Convert.ToInt32(origQtyObj ?? op.Quantity);
                    currentQty = Convert.ToInt32(currQtyObj ?? op.Quantity);

                    // delta: original - current (positive => add back; negative => remove more)
                    var qtyDelta = originalQty - currentQty;
                    if (qtyDelta !=0)
                    {
                        AddDelta(deltas, productId, qtyDelta);
                    }

                    // Handle rental returned: if status changed to Returned and product is rental we will return the qty
                    if (
                        (entry.OriginalValues.Properties.Any(p => p.Name == "Status") || (dbValues != null && dbValues.Properties.Any(p => p.Name == "Status")))
                        && entry.CurrentValues.Properties.Any(p => p.Name == "Status")
                    )
                    {
                        var origStatusObj = entry.OriginalValues.Properties.Any(p => p.Name == "Status")
                            ? entry.OriginalValues["Status"]
                            : dbValues?["Status"];
                        var currStatusObj = entry.CurrentValues["Status"];

                        var origStatusInt =
                            origStatusObj != null
                                ? Convert.ToInt32(origStatusObj)
                                : (int)OrderProductStatus.InProgress;
                        var currStatusInt =
                            currStatusObj != null
                                ? Convert.ToInt32(currStatusObj)
                                : (int)OrderProductStatus.InProgress;

                        var origStatus = (OrderProductStatus)origStatusInt;
                        var currStatus = (OrderProductStatus)currStatusInt;

                        if (
                            origStatus != OrderProductStatus.Returned
                            && currStatus == OrderProductStatus.Returned
                        )
                        {
                            // returned -> put back quantity
                            AddDelta(deltas, productId, originalQty);
                        }
                        else if (
                            origStatus == OrderProductStatus.Returned
                            && currStatus != OrderProductStatus.Returned
                        )
                        {
                            // was returned and now not returned -> reserve stock (subtract current qty)
                            AddDelta(deltas, productId, -currentQty);
                        }
                    }
                }
            }

            if (deltas.Any())
            {
                // Load affected products to check types and apply deltas only for Sale and Rental
                var productIds = deltas.Keys.ToList();
                var products = await context
                    .Set<Product>()
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync(cancellationToken);

                foreach (var p in products)
                {
                    if (p == null)
                        continue;

                    // apply only for Sale or Rental
                    if (p.Type == ProductType.Sale || p.Type == ProductType.Rental)
                    {
                        var d = deltas.ContainsKey(p.Id) ? deltas[p.Id] : 0;
                        if (d != 0)
                        {
                            // update quantityinStock
                            // QuantityInStock type may be int or decimal; assume int for now
                            p.QuantityInStock = p.QuantityInStock + d;

                            // mark modified
                            context.Entry(p).Property("QuantityInStock").IsModified = true;
                        }
                    }
                }
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }

        #endregion Public methods

        #region Private methods

        private static void AddDelta(Dictionary<Guid, int> dict, Guid productId, int delta)
        {
            if (productId == Guid.Empty)
                return;
            if (dict.ContainsKey(productId))
                dict[productId] += delta;
            else
                dict[productId] = delta;
        }

        #endregion Private methods
    }
}
