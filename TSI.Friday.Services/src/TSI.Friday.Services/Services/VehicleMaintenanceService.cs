using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class VehicleMaintenanceService : IVehicleMaintenanceService
    {
        #region Properties

        private readonly IRepository<VehicleMaintenance> _repository;
        private readonly IRepository<Vehicle> _vehicleRepository;
        private readonly IFeatureToggleService _featureToggleService;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        public VehicleMaintenanceService(
            IRepository<VehicleMaintenance> repository,
            IRepository<Vehicle> vehicleRepository,
            IFeatureToggleService featureToggleService,
            ILogService logService
        )
        {
            _repository = repository;
            _vehicleRepository = vehicleRepository;
            _featureToggleService = featureToggleService;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<VehicleMaintenance>> Add(VehicleMaintenance maintenance)
        {
            WebApiResponse<VehicleMaintenance> result = new();

            try
            {
                if (
                    maintenance.Status == MaintenanceStatus.Scheduled
                    && maintenance.ScheduledDate.Date < DateTime.UtcNow.Date
                )
                {
                    maintenance.Status = MaintenanceStatus.Overdue;
                }

                await _repository.AddAsync(maintenance);
                await SyncVehicleStatusAsync(maintenance.VehicleId);

                result.Data = maintenance;
                result.Status = ResponseStatus.Success;
                result.Message = "Manutenção cadastrada com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.Add", maintenance);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar a Manutenção na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<VehicleMaintenance>> Update(VehicleMaintenance maintenance)
        {
            WebApiResponse<VehicleMaintenance> result = new();

            try
            {
                if (
                    maintenance.Status == MaintenanceStatus.Completed
                    && maintenance.CompletedDate == null
                )
                {
                    maintenance.CompletedDate = DateTime.UtcNow;
                }

                await _repository.UpdateAsync(maintenance);
                await SyncVehicleStatusAsync(maintenance.VehicleId);

                result.Data = maintenance;
                result.Status = ResponseStatus.Success;
                result.Message = "Manutenção atualizada com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.Update", maintenance);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar a Manutenção na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<VehicleMaintenance>> Remove(VehicleMaintenance maintenance)
        {
            WebApiResponse<VehicleMaintenance> result = new();

            try
            {
                await _repository.RemoveAsync(maintenance);
                await SyncVehicleStatusAsync(maintenance.VehicleId);

                result.Data = maintenance;
                result.Status = ResponseStatus.Success;
                result.Message = "Manutenção removida com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.Remove", maintenance);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover a Manutenção da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<VehicleMaintenance>>> FindAll()
        {
            WebApiResponse<IEnumerable<VehicleMaintenance>> result = new();

            try
            {
                if (!await _featureToggleService.IsEnabledAsync(FeatureToggleKeys.VehicleMaintenance, FeatureToggleKeys.FleetModule))
                {
                    result.Data = [];
                    result.Status = ResponseStatus.Success;
                    result.Message = "0 registro(s) encontrado(s).";
                    return result;
                }

                result.Data = await _repository.GetAllAsync(m => m.Vehicle);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.FindAll", null);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Manutenção na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<VehicleMaintenance>> FindById(Guid? id)
        {
            WebApiResponse<VehicleMaintenance> result = new();

            try
            {
                if (!await _featureToggleService.IsEnabledAsync(FeatureToggleKeys.VehicleMaintenance, FeatureToggleKeys.FleetModule))
                {
                    result.Data = null;
                    result.Status = ResponseStatus.Success;
                    result.Message = $"Nenhuma Manutenção com o ID {id} foi encontrada";
                    return result;
                }

                result.Data = await _repository.GetByIdAsync(id, m => m.Vehicle);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? "Manutenção encontrada com sucesso"
                        : $"Nenhuma Manutenção com o ID {id} foi encontrada";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.FindById", id);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Manutenção na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<VehicleMaintenance>>> FindByVehicle(
            Guid vehicleId
        )
        {
            WebApiResponse<IEnumerable<VehicleMaintenance>> result = new();

            try
            {
                if (!await _featureToggleService.IsEnabledAsync(FeatureToggleKeys.VehicleMaintenance, FeatureToggleKeys.FleetModule))
                {
                    result.Data = [];
                    result.Status = ResponseStatus.Success;
                    result.Message = "0 registro(s) encontrado(s).";
                    return result;
                }

                result.Data = await _repository.QueryAsync(_ => _.VehicleId == vehicleId);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleMaintenanceService.FindByVehicle", vehicleId);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Manutenção na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Blocks the Vehicle when it has any pending (InProgress/Overdue) maintenance, or releases
        /// it back to Available when there is none, keeping Vehicle.Status in sync with its
        /// maintenance history without requiring the caller to manage it manually.
        /// </summary>
        private async Task SyncVehicleStatusAsync(Guid vehicleId)
        {
            var vehicles = await _vehicleRepository.QueryAsync(v => v.Id == vehicleId);
            var vehicle = vehicles.FirstOrDefault();

            if (vehicle == null || vehicle.Status == VehicleStatus.Inactive)
            {
                return;
            }

            var hasPendingMaintenance = await _repository.AnyAsync(m =>
                m.VehicleId == vehicleId
                && (
                    m.Status == MaintenanceStatus.InProgress
                    || m.Status == MaintenanceStatus.Overdue
                )
            );

            var desiredStatus = hasPendingMaintenance
                ? VehicleStatus.Blocked
                : VehicleStatus.Available;

            if (vehicle.Status != desiredStatus)
            {
                vehicle.Status = desiredStatus;
                await _vehicleRepository.UpdateAsync(vehicle);
            }
        }

        #endregion Private methods
    }
}
