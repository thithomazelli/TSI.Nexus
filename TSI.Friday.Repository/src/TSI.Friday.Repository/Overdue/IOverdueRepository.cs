using System;
using System.Threading.Tasks;

namespace TSI.Friday.Repository.Overdue
{
    public interface IOverdueRepository
    {
        /// <summary>
        /// Marks OrderProducts whose due date has passed and are still pending as overdue.
        /// </summary>
        /// <param name="systemUserId">The user ID to be recorded as the modifier of the affected records.</param>
        /// <returns>How many OrderProducts were marked as overdue.</returns>
        Task<int> MarkOverdueOrderProductsAsync(string systemUserId);

        /// <summary>
        /// Marks Payments whose due date has passed and are still pending as overdue.
        /// </summary>
        /// <param name="systemUserId">The user ID to be recorded as the modifier of the affected records.</param>
        /// <returns>How many Payments were marked as overdue.</returns>
        Task<int> MarkOverduePaymentsAsync(string systemUserId);
    }
}
