using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Data.Interceptors
{
    public class AuditingSaveChangesInterceptor : SaveChangesInterceptor
    {
        private readonly ICurrentUserService _currentUserService;

        public AuditingSaveChangesInterceptor(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        public override async ValueTask<InterceptionResult<int>> SavingChangesAsync(
            DbContextEventData eventData,
            InterceptionResult<int> result,
            CancellationToken cancellationToken = default
        )
        {
            var context = eventData.Context as DbContext;
            if (context == null)
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            // Cheap short-circuit: only run when there are BaseModel changes
            var hasBaseModelChanges = context
                .ChangeTracker.Entries<BaseModel>()
                .Any(e => e.State == EntityState.Added || e.State == EntityState.Modified);

            if (!hasBaseModelChanges)
            {
                return await base.SavingChangesAsync(eventData, result, cancellationToken);
            }

            string userId = _currentUserService?.GetUserId();
            var userIdNonNull = userId ?? string.Empty;

            var entries = context
                .ChangeTracker.Entries()
                .Where(e =>
                    e.Entity is BaseModel
                    && (e.State == EntityState.Added || e.State == EntityState.Modified)
                )
                .ToList();

            foreach (var entry in entries)
            {
                var entity = (BaseModel)entry.Entity;

                if (entry.State == EntityState.Added)
                {
                    entity.CreateDate = DateTime.UtcNow;
                    entity.CreateUserId = userIdNonNull;
                }

                entity.ModifyDate = DateTime.UtcNow;
                entity.ModifyUserId = userIdNonNull;
            }

            // Prevent overwriting creation audit fields on updates
            var modifiedBaseEntries = context
                .ChangeTracker.Entries()
                .Where(e => e.Entity is BaseModel && e.State == EntityState.Modified)
                .ToList();

            foreach (var me in modifiedBaseEntries)
            {
                if (me.Properties.Any(p => p.Metadata.Name == "CreateDate"))
                {
                    me.Property("CreateDate").IsModified = false;
                }
                if (me.Properties.Any(p => p.Metadata.Name == "CreateUserId"))
                {
                    me.Property("CreateUserId").IsModified = false;
                }
            }

            return await base.SavingChangesAsync(eventData, result, cancellationToken);
        }
    }
}
