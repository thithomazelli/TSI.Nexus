using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class PaymentInstallmentService : IPaymentInstallmentService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the PaymentInstallment registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<PaymentInstallment> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// PaymentInstallmentService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<PaymentInstallment> object used to initialize the internal variable using Dependency Injection.</param>
        public PaymentInstallmentService(IRepository<PaymentInstallment> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentInstallmentDto>> Add(
            PaymentInstallmentDto paymentDto
        )
        {
            WebApiResponse<PaymentInstallmentDto> result = new();

            try
            {
                var paymentEntity = _mapper.Map<PaymentInstallment>(paymentDto);
                await _repository.AddAsync(paymentEntity);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {paymentDto.Description} cadastrada com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar a Parcela do pagamento {paymentDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentInstallmentDto>> Update(
            PaymentInstallmentDto paymentDto
        )
        {
            WebApiResponse<PaymentInstallmentDto> result = new();

            try
            {
                var paymentEntity = _mapper.Map<PaymentInstallment>(paymentDto);
                await _repository.UpdateAsync(paymentEntity);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {paymentDto.Description} atualizada com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados da Parcela do pagamento {paymentDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<PaymentInstallmentDto>> result = new();

            try
            {
                var payments = await _repository.GetAllAsync(o => o.Payment);
                result.Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Parcelas de Pagamento na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentInstallmentDto>> Remove(
            PaymentInstallmentDto paymentDto
        )
        {
            WebApiResponse<PaymentInstallmentDto> result = new();

            try
            {
                var paymentEntity = _mapper.Map<PaymentInstallment>(paymentDto);
                await _repository.RemoveAsync(paymentEntity);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {paymentDto.Description} removida com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover a Parcela do pagamento {paymentDto?.Description} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentInstallmentDto>> FindById(int? id)
        {
            WebApiResponse<PaymentInstallmentDto> result = new();

            try
            {
                var payment = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<PaymentInstallmentDto>(payment);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Parcela do pagamento {result.Data.Description} encontrada com sucesso"
                        : $"Nenhuma Parcela de pagamento com o ID {id} foi encontrada";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Parcelas de Pagamento na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByPaymentId(
            int? paymentId
        )
        {
            WebApiResponse<IEnumerable<PaymentInstallmentDto>> result = new();

            try
            {
                var payments = await _repository.QueryAsync(p => p.PaymentId == paymentId);
                result.Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Pagamento baseado no Pagamento {paymentId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByClientId(
            int? clientId
        )
        {
            WebApiResponse<IEnumerable<PaymentInstallmentDto>> result = new();

            try
            {
                var payments = await _repository.QueryAsync(p => p.ClientId == clientId);
                result.Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Pagamento baseado no Cliente {clientId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByOrderId(
            int? orderId
        )
        {
            WebApiResponse<IEnumerable<PaymentInstallmentDto>> result = new();

            try
            {
                var payments = await _repository.QueryAsync(p => p.OrderId == orderId);
                result.Data = _mapper.Map<IEnumerable<PaymentInstallmentDto>>(payments);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Pagamento baseado no Pedido {orderId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods
    }
}
