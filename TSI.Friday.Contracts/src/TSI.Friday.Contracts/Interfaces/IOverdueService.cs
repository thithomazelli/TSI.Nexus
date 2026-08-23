using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IOverdueService
    {
        /// <summary>
        /// Marks Payments whose due date has passed as overdue, so the office can be alerted
        /// about pending amounts that are no longer within their expected term.
        /// </summary>
        /// <returns>How many Payments were marked as overdue by this run.</returns>
        Task<OverdueResult> RunOverdueUpdateAsync();
    }
}
