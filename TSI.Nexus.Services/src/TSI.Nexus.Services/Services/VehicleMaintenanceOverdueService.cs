using Microsoft.Extensions.Configuration;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services
{
    public class VehicleMaintenanceOverdueService : IVehicleMaintenanceOverdueService
    {
        private readonly IRepository<VehicleMaintenance> _maintenanceRepository;
        private readonly IRepository<Vehicle> _vehicleRepository;
        private readonly IAlertConfigService _alertConfigService;
        private readonly string _systemUserId;

        #region Public methods

        public VehicleMaintenanceOverdueService(
            IRepository<VehicleMaintenance> maintenanceRepository,
            IRepository<Vehicle> vehicleRepository,
            IAlertConfigService alertConfigService,
            IConfiguration configuration
        )
        {
            _maintenanceRepository = maintenanceRepository;
            _vehicleRepository = vehicleRepository;
            _alertConfigService = alertConfigService;
            _systemUserId = configuration["OverdueSystemUserId"] ?? "overdue-batch";
        }

        /// <inheritdoc />
        public async Task<VehicleMaintenanceOverdueResult> RunOverdueUpdateAsync()
        {
            if (!await _alertConfigService.IsEnabledAsync(AlertConfigKeys.VehicleMaintenanceOverdue))
            {
                return new VehicleMaintenanceOverdueResult
                {
                    MaintenancesUpdated = 0,
                    VehiclesBlocked = 0,
                };
            }

            var today = DateTime.UtcNow.Date;

            var overdueMaintenances = await _maintenanceRepository.QueryAsync(m =>
                m.Status == MaintenanceStatus.Scheduled && m.ScheduledDate < today
            );

            var vehicleIdsToBlock = new HashSet<Guid>();

            foreach (var maintenance in overdueMaintenances)
            {
                maintenance.Status = MaintenanceStatus.Overdue;
                maintenance.ModifyDate = DateTime.UtcNow;
                maintenance.ModifyUserId = _systemUserId;
                await _maintenanceRepository.UpdateAsync(maintenance);
                vehicleIdsToBlock.Add(maintenance.VehicleId);
            }

            var blockedCount = 0;
            foreach (var vehicleId in vehicleIdsToBlock)
            {
                var vehicles = await _vehicleRepository.QueryAsync(v => v.Id == vehicleId);
                var vehicle = vehicles.FirstOrDefault();

                if (
                    vehicle != null
                    && vehicle.Status != VehicleStatus.Blocked
                    && vehicle.Status != VehicleStatus.Inactive
                )
                {
                    vehicle.Status = VehicleStatus.Blocked;
                    vehicle.ModifyDate = DateTime.UtcNow;
                    vehicle.ModifyUserId = _systemUserId;
                    await _vehicleRepository.UpdateAsync(vehicle);
                    blockedCount++;
                }
            }

            return new VehicleMaintenanceOverdueResult
            {
                MaintenancesUpdated = overdueMaintenances.Count,
                VehiclesBlocked = blockedCount,
            };
        }

        #endregion Public methods
    }
}
