using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class DriverService : IDriverService
    {
        #region Properties

        private readonly IRepository<Driver> _repository;
        private readonly IRepository<Order> _orderRepository;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        public DriverService(
            IRepository<Driver> repository,
            IRepository<Order> orderRepository,
            ILogService logService
        )
        {
            _repository = repository;
            _orderRepository = orderRepository;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Driver>> Add(Driver driver)
        {
            WebApiResponse<Driver> result = new();

            try
            {
                var duplicatedMessage = await CheckIfDriverIsDuplicatedAndGetErrorMessage(driver);

                if (!string.IsNullOrEmpty(duplicatedMessage))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = duplicatedMessage;
                    return result;
                }

                await _repository.AddAsync(driver);

                result.Data = driver;
                result.Status = ResponseStatus.Success;
                result.Message = $"Motorista {driver.Name} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.Add", driver);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Motorista {driver.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Driver>> Update(Driver driver)
        {
            WebApiResponse<Driver> result = new();

            try
            {
                var duplicatedMessage = await CheckIfDriverIsDuplicatedAndGetErrorMessage(driver);

                if (!string.IsNullOrEmpty(duplicatedMessage))
                {
                    var ex = new Exception(duplicatedMessage);
                    _logService.LogException(ex, "DriverService.Update", driver);

                    result.Status = ResponseStatus.Error;
                    result.Message = duplicatedMessage;
                    return result;
                }

                await _repository.UpdateAsync(driver);

                result.Data = driver;
                result.Status = ResponseStatus.Success;
                result.Message = $"Motorista {driver.Name} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.Update", driver);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Motorista {driver.Name} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Driver>> Remove(Driver driver)
        {
            WebApiResponse<Driver> result = new();

            try
            {
                if (await _orderRepository.AnyAsync(_ => _.DriverId == driver.Id))
                {
                    var message =
                        $"Motorista {driver.Name} não pode ser removido pois está vinculado à uma ou mais viagens.";
                    var ex = new Exception(message);
                    _logService.LogException(ex, "DriverService.Remove", driver);

                    result.Data = driver;
                    result.Status = ResponseStatus.Warning;
                    result.Message = message;
                    return result;
                }

                await _repository.RemoveAsync(driver);

                result.Data = driver;
                result.Status = ResponseStatus.Success;
                result.Message = $"Motorista {driver.Name} removido com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.Remove", driver);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Motorista {driver.Name} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Driver>>> FindAll()
        {
            WebApiResponse<IEnumerable<Driver>> result = new();

            try
            {
                result.Data = await _repository.GetAllAsync();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.FindAll", null);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Motoristas na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Driver>> FindById(Guid? id)
        {
            WebApiResponse<Driver> result = new();

            try
            {
                result.Data = await _repository.GetByIdAsync(id);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Motorista {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Motorista com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.FindById", id);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Motoristas na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Driver>> FindBySocialSecurityCard(
            string socialSecurityCard
        )
        {
            WebApiResponse<Driver> result = new();

            try
            {
                result.Data = await _repository.FirstOrDefaultAsync(_ =>
                    _.SocialSecurityCard.Equals(socialSecurityCard)
                );
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Motorista {result.Data.Name} encontrado com sucesso"
                        : $"Nenhum Motorista com CPF {socialSecurityCard} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(
                    ex,
                    "DriverService.FindBySocialSecurityCard",
                    socialSecurityCard
                );

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Motoristas na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Driver>>> FindActive()
        {
            WebApiResponse<IEnumerable<Driver>> result = new();

            try
            {
                result.Data = await _repository.QueryAsync(_ => _.Status == DriverStatus.Active);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "DriverService.FindActive", null);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Motoristas na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Should verify if the Driver is already being registered on the database.
        /// </summary>
        /// <param name="driver">The Driver object that is being added or updated.</param>
        /// <returns>The error message when Driver is duplicated. Otherwise an empty string.</returns>
        private async Task<string> CheckIfDriverIsDuplicatedAndGetErrorMessage(Driver driver)
        {
            if (await IsSocialSecurityCardDuplicated(driver))
            {
                return $"Já existe um Motorista cadastrado com o CPF {driver.SocialSecurityCard}.";
            }

            return string.Empty;
        }

        /// <summary>
        /// Should verify if the Driver CPF is already being used by another register on the database.
        /// </summary>
        /// <param name="driver">The Driver object that is being added or updated.</param>
        /// <returns>True when the CPF is duplicated; Otherwise false.</returns>
        private Task<bool> IsSocialSecurityCardDuplicated(Driver driver)
        {
            return _repository.AnyAsync(_ =>
                _.Id != driver.Id
                && !string.IsNullOrEmpty(_.SocialSecurityCard)
                && _.SocialSecurityCard == driver.SocialSecurityCard
            );
        }

        #endregion Private methods
    }
}
