using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class VehicleService : IVehicleService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Vehicle registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Vehicle> _repository;
        private readonly IRepository<Order> _orderRepository;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// VehicleService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        public VehicleService(
            IRepository<Vehicle> repository,
            IRepository<Order> orderRepository,
            ILogService logService
        )
        {
            _repository = repository;
            _orderRepository = orderRepository;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Vehicle>> Add(Vehicle vehicle)
        {
            WebApiResponse<Vehicle> result = new();

            try
            {
                var duplicatedMessage = await CheckIfVehicleIsDuplicatedAndGetErrorMessage(vehicle);

                if (!string.IsNullOrEmpty(duplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = duplicatedMessage;
                    return result;
                }

                await _repository.AddAsync(vehicle);

                result.Data = vehicle;
                result.Status = ResponseStatus.Success;
                result.Message = $"Veículo {vehicle.Plate} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.Add", vehicle);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Veículo {vehicle.Plate} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Vehicle>> Update(Vehicle vehicle)
        {
            WebApiResponse<Vehicle> result = new();

            try
            {
                var duplicatedMessage = await CheckIfVehicleIsDuplicatedAndGetErrorMessage(vehicle);

                if (!string.IsNullOrEmpty(duplicatedMessage))
                {
                    var ex = new Exception(duplicatedMessage);
                    _logService.LogException(ex, "VehicleService.Update", vehicle);

                    result.Status = ResponseStatus.Error;
                    result.Message = duplicatedMessage;
                    return result;
                }

                await _repository.UpdateAsync(vehicle);

                result.Data = vehicle;
                result.Status = ResponseStatus.Success;
                result.Message = $"Veículo {vehicle.Plate} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.Update", vehicle);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Veículo {vehicle.Plate} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Vehicle>> Remove(Vehicle vehicle)
        {
            WebApiResponse<Vehicle> result = new();

            try
            {
                if (await _orderRepository.AnyAsync(_ => _.VehicleId == vehicle.Id))
                {
                    var message =
                        $"Veículo {vehicle.Plate} não pode ser removido pois está vinculado à uma ou mais viagens.";
                    var ex = new Exception(message);
                    _logService.LogException(ex, "VehicleService.Remove", vehicle);

                    result.Data = vehicle;
                    result.Status = ResponseStatus.Warning;
                    result.Message = message;
                    return result;
                }

                await _repository.RemoveAsync(vehicle);

                result.Data = vehicle;
                result.Status = ResponseStatus.Success;
                result.Message = $"Veículo {vehicle.Plate} removido com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.Remove", vehicle);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Veículo {vehicle.Plate} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Vehicle>>> FindAll()
        {
            WebApiResponse<IEnumerable<Vehicle>> result = new();

            try
            {
                result.Data = await _repository.GetAllAsync();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.FindAll", null);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Vehicle>> FindById(Guid? id)
        {
            WebApiResponse<Vehicle> result = new();

            try
            {
                result.Data = await _repository.GetByIdAsync(id);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Veículo {result.Data.Plate} encontrado com sucesso"
                        : $"Nenhum Veículo com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.FindById", id);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Vehicle>> FindByPlate(string plate)
        {
            WebApiResponse<Vehicle> result = new();

            try
            {
                result.Data = await _repository.FirstOrDefaultAsync(_ => _.Plate.Equals(plate));
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Veículo {result.Data.Plate} encontrado com sucesso"
                        : $"Nenhum Veículo com placa {plate} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.FindByPlate", plate);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Vehicle>>> FindAvailable()
        {
            WebApiResponse<IEnumerable<Vehicle>> result = new();

            try
            {
                result.Data = await _repository.QueryAsync(_ =>
                    _.Status == VehicleStatus.Available
                );
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.FindAvailable", null);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Vehicle>>> FindWithExpiringLicense(
            int daysAhead
        )
        {
            WebApiResponse<IEnumerable<Vehicle>> result = new();

            try
            {
                var threshold = DateTime.UtcNow.Date.AddDays(daysAhead);

                result.Data = await _repository.QueryAsync(_ =>
                    _.TransportLicenseExpiryDate != null
                    && _.TransportLicenseExpiryDate.Value.Date <= threshold
                );
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "VehicleService.FindWithExpiringLicense", daysAhead);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Veículos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Vehicle is already being registered on the database.
        /// </summary>
        /// <param name="vehicle">The Vehicle object that is being added or updated.</param>
        /// <returns>The error message when Vehicle is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfVehicleIsDuplicatedAndGetErrorMessage(Vehicle vehicle)
        {
            if (await IsPlateDuplicated(vehicle))
            {
                return $"Já existe um Veículo cadastrado com a placa {vehicle.Plate}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Vehicle plate is already being used by another register on the database.
        /// </summary>
        /// <param name="vehicle">The Vehicle object that is being added or updated.</param>
        /// <returns>True when the Plate is duplicated; Otherwise false.</returns>
        private Task<bool> IsPlateDuplicated(Vehicle vehicle)
        {
            return _repository.AnyAsync(_ =>
                _.Id != vehicle.Id && !string.IsNullOrEmpty(_.Plate) && _.Plate == vehicle.Plate
            );
        }

        #endregion Private methods
    }
}
