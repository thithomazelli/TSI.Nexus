using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IVehicleMaintenanceOverdueService
    {
        /// <summary>
        /// Marks Scheduled maintenances whose ScheduledDate has passed as Overdue and blocks the
        /// related Vehicles so they cannot be assigned to a new trip while service is pending.
        /// </summary>
        Task<VehicleMaintenanceOverdueResult> RunOverdueUpdateAsync();
    }
}
