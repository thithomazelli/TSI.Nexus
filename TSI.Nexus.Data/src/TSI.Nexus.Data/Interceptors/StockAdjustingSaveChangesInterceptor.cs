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

            // Build list of ids to load originals from DB (modified and deleted)
            var idsToLoad = entries
                .Where(e => e.State != EntityState.Added)
                .Select(e =>
                {
                    // try OriginalValues Id, then CurrentValues Id, then entity Id
                    object idObj = null;
                    if (e.OriginalValues.Properties.Any(p => p.Name == "Id"))
                        idObj = e.OriginalValues["Id"];
                    if (idObj == null && e.CurrentValues.Properties.Any(p => p.Name == "Id"))
                        idObj = e.CurrentValues["Id"];
                    if (idObj == null)
                    {
                        var ent = (OrderProduct)e.Entity;
                        idObj = ent?.Id;
                    }

                    return idObj is Guid g ? g : Guid.Empty;
                })
                .Where(g => g != Guid.Empty)
                .Distinct()
                .ToList();

            // load originals in one query
            var originals =
                new Dictionary<Guid, (Guid ProductId, int Quantity, OrderProductStatus Status)>();
            if (idsToLoad.Any())
            {
                var rows = await context
                    .Set<OrderProduct>()
                    .Where(op => idsToLoad.Contains(op.Id))
                    .Select(op => new
                    {
                        op.Id,
                        op.ProductId,
                        op.Quantity,
                        op.Status,
                    })
                    .ToListAsync(cancellationToken);

                foreach (var r in rows)
                {
                    originals[r.Id] = (r.ProductId, Convert.ToInt32(r.Quantity), r.Status);
                }
            }

            // accumulate deltas per productId (delta to be added to Product.QuantityInStock)
            var deltas = new Dictionary<Guid, int>();

            foreach (var entry in entries)
            {
                var op = (OrderProduct)entry.Entity;

                // Helper to add delta
                void add(Guid pid, int delta)
                {
                    if (pid == Guid.Empty)
                        return;
                    if (deltas.ContainsKey(pid))
                        deltas[pid] += delta;
                    else
                        deltas[pid] = delta;
                }

                // read current values
                Guid currentProductId = Guid.Empty;
                int currentQty = 0;
                OrderProductStatus currentStatus = OrderProductStatus.InProgress;

                if (entry.CurrentValues.Properties.Any(p => p.Name == "ProductId"))
                {
                    var val = entry.CurrentValues["ProductId"];
                    if (val is Guid g && g != Guid.Empty)
                        currentProductId = g;
                }
                if (currentProductId == Guid.Empty && op != null && op.ProductId != Guid.Empty)
                {
                    currentProductId = op.ProductId;
                }

                if (entry.CurrentValues.Properties.Any(p => p.Name == "Quantity"))
                {
                    var val = entry.CurrentValues["Quantity"];
                    currentQty = val != null ? Convert.ToInt32(val) : Convert.ToInt32(op.Quantity);
                }
                else
                {
                    currentQty = Convert.ToInt32(op.Quantity);
                }

                if (entry.CurrentValues.Properties.Any(p => p.Name == "Status"))
                {
                    var val = entry.CurrentValues["Status"];
                    if (val != null)
                        currentStatus = (OrderProductStatus)Convert.ToInt32(val);
                    else
                        currentStatus = op.Status;
                }
                else
                {
                    currentStatus = op.Status;
                }

                if (entry.State == EntityState.Added)
                {
                    // adding reserves stock unless already Returned
                    if (currentStatus != OrderProductStatus.Returned)
                    {
                        add(currentProductId, -currentQty);
                    }
                }
                else if (entry.State == EntityState.Deleted)
                {
                    // find original
                    var idObj = entry.OriginalValues.Properties.Any(p => p.Name == "Id")
                        ? entry.OriginalValues["Id"]
                        : (
                            entry.CurrentValues.Properties.Any(p => p.Name == "Id")
                                ? entry.CurrentValues["Id"]
                                : (object)op.Id
                        );
                    var id = idObj is Guid gid ? gid : Guid.Empty;
                    if (id != Guid.Empty && originals.TryGetValue(id, out var orig))
                    {
                        // removing an order item returns stock
                        add(orig.ProductId, orig.Quantity);
                    }
                    else
                    {
                        // fallback to entity values
                        add(currentProductId, Convert.ToInt32(op.Quantity));
                    }
                }
                else if (entry.State == EntityState.Modified)
                {
                    // find original
                    var idObj = entry.OriginalValues.Properties.Any(p => p.Name == "Id")
                        ? entry.OriginalValues["Id"]
                        : (
                            entry.CurrentValues.Properties.Any(p => p.Name == "Id")
                                ? entry.CurrentValues["Id"]
                                : (object)op.Id
                        );
                    var id = idObj is Guid gid ? gid : Guid.Empty;

                    Guid originalProductId = Guid.Empty;
                    int originalQty = 0;
                    OrderProductStatus originalStatus = OrderProductStatus.InProgress;

                    if (id != Guid.Empty && originals.TryGetValue(id, out var o))
                    {
                        originalProductId = o.ProductId;
                        originalQty = o.Quantity;
                        originalStatus = o.Status;
                    }
                    else
                    {
                        // fallback to original values snapshot
                        if (entry.OriginalValues.Properties.Any(p => p.Name == "ProductId"))
                        {
                            var val = entry.OriginalValues["ProductId"];
                            if (val is Guid g && g != Guid.Empty)
                                originalProductId = g;
                        }
                        if (originalProductId == Guid.Empty)
                            originalProductId = op.ProductId;

                        if (entry.OriginalValues.Properties.Any(p => p.Name == "Quantity"))
                        {
                            var val = entry.OriginalValues["Quantity"];
                            originalQty =
                                val != null ? Convert.ToInt32(val) : Convert.ToInt32(op.Quantity);
                        }
                        else
                        {
                            originalQty = Convert.ToInt32(op.Quantity);
                        }

                        if (entry.OriginalValues.Properties.Any(p => p.Name == "Status"))
                        {
                            var val = entry.OriginalValues["Status"];
                            if (val != null)
                                originalStatus = (OrderProductStatus)Convert.ToInt32(val);
                        }
                        else
                        {
                            originalStatus = op.Status;
                        }
                    }

                    // If product changed, treat as delete from original product + add to new product
                    if (originalProductId != Guid.Empty && originalProductId != currentProductId)
                    {
                        // return original reservation
                        add(originalProductId, originalQty);

                        // reserve on new product unless returned
                        if (currentStatus != OrderProductStatus.Returned)
                        {
                            add(currentProductId, -currentQty);
                        }

                        // no further processing for same-product deltas
                        continue;
                    }

                    // same product: quantity delta
                    var qtyDelta = originalQty - currentQty;
                    if (qtyDelta != 0)
                    {
                        add(currentProductId, qtyDelta);
                    }

                    // status transitions
                    if (
                        originalStatus != OrderProductStatus.Returned
                        && currentStatus == OrderProductStatus.Returned
                    )
                    {
                        // returned -> put back the original reserved quantity
                        add(currentProductId, originalQty);
                    }
                    else if (
                        originalStatus == OrderProductStatus.Returned
                        && currentStatus != OrderProductStatus.Returned
                    )
                    {
                        // was returned and now not returned -> reserve stock (subtract current qty)
                        add(currentProductId, -currentQty);
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
    }
}
