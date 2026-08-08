using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class CommissionService : ICommissionService
    {
        #region Properties

        private readonly IRepository<Commission> _repository;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        public CommissionService(IRepository<Commission> repository, ILogService logService)
        {
            _repository = repository;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Commission>> Update(Commission commission)
        {
            WebApiResponse<Commission> result = new();

            try
            {
                if (commission.Status == CommissionStatus.Paid && commission.PaidDate == null)
                {
                    commission.PaidDate = DateTime.UtcNow;
                }

                await _repository.UpdateAsync(commission);

                result.Data = commission;
                result.Status = ResponseStatus.Success;
                result.Message = "Comissão atualizada com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "CommissionService.Update", commission);

                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar a comissão na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<Commission>> FindById(Guid? id)
        {
            WebApiResponse<Commission> result = new();

            try
            {
                result.Data = await _repository.GetByIdAsync(id);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? "Comissão encontrada com sucesso"
                        : $"Nenhuma comissão com o ID {id} foi encontrada";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "CommissionService.FindById", id);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de comissão na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<Commission>>> FindByDriver(Guid driverId)
        {
            WebApiResponse<IEnumerable<Commission>> result = new();

            try
            {
                result.Data = await _repository.QueryAsync(_ => _.DriverId == driverId);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "CommissionService.FindByDriver", driverId);

                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de comissão na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods
    }
}
