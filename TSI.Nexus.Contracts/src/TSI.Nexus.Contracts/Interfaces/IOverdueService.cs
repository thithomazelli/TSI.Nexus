using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IOverdueService
    {
        /// <summary>
        /// Marks OrderProducts and Payments whose due date has passed as overdue, so the office
        /// can be alerted about pending amounts that are no longer within their expected term.
        /// </summary>
        /// <returns>How many OrderProducts and Payments were marked as overdue by this run.</returns>
        Task<OverdueResult> RunOverdueUpdateAsync();
    }
}
