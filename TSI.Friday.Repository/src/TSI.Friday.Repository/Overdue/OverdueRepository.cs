using Microsoft.EntityFrameworkCore;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data;

namespace TSI.Friday.Repository.Overdue
{
    public class OverdueRepository : IOverdueRepository
    {
        private readonly MyDBContextEF _context;

        public OverdueRepository(MyDBContextEF context)
        {
            _context = context;
        }

        /// <inheritdoc />
        public async Task<int> MarkOverdueOrderProductsAsync(string systemUserId)
        {
            var today = DateTime.UtcNow.Date;

            var opQuery = _context
                .Set<OrderProduct>()
                .Where(op =>
                    op.Status == OrderProductStatus.InProgress
                    && op.EndDate != default(DateTime)
                    // compare only dates (day/month/year) by comparing to today's midnight
                    && op.EndDate < today
                );

            var updatedOps = await opQuery.ExecuteUpdateAsync(s =>
                s.SetProperty(op => op.Status, op => OrderProductStatus.Delayed)
                    .SetProperty(op => op.ModifyDate, op => DateTime.UtcNow)
                    .SetProperty(op => op.ModifyUserId, op => systemUserId)
            );

            return updatedOps;
        }

        /// <inheritdoc />
        public async Task<int> MarkOverduePaymentsAsync(string systemUserId)
        {
            var today = DateTime.UtcNow.Date;

            var pQuery = _context
                .Set<Payment>()
                .Where(p => p.Status == PaymentStatus.Pending
                // compare only date portion by comparing to today's midnight
                && p.Date < today
                );

            var updatedPayments = await pQuery.ExecuteUpdateAsync(s =>
                s.SetProperty(p => p.Status, p => PaymentStatus.Delayed)
                    .SetProperty(p => p.ModifyDate, p => DateTime.UtcNow)
                    .SetProperty(p => p.ModifyUserId, p => systemUserId)
            );

            return updatedPayments;
        }
    }
}
