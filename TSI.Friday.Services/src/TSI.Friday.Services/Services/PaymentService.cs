using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class PaymentService : IPaymentService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Payment registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Payment> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// PaymentService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Payment> object used to initialize the internal variable using Dependency Injection.</param>
        public PaymentService(IRepository<Payment> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> Add(PaymentDto transactionDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                var transactionEntity = _mapper.Map<Payment>(transactionDto);
                await _repository.AddAsync(transactionEntity);

                result.Data = transactionDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {transactionDto.Description} cadastrada com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar a Parcela do pagamento {transactionDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> Update(PaymentDto transactionDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                if (
                    transactionDto.Status == PaymentStatus.Pending
                    && transactionDto.Date.ToUniversalTime().Date < DateTime.UtcNow.Date
                )
                {
                    transactionDto.Status = PaymentStatus.Delayed;
                }

                var transactionEntity = _mapper.Map<Payment>(transactionDto);
                await _repository.UpdateAsync(transactionEntity);

                result.Data = transactionDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {transactionDto.Description} atualizada com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados da Parcela do pagamento {transactionDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var transactions = await _repository.GetAllAsync(
                    t => t.Transaction,
                    c => c.BusinessPartner,
                    o => o.Order
                );
                result.Data = _mapper.Map<IEnumerable<PaymentDto>>(transactions);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Parcelas de Transação na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> Remove(PaymentDto transactionDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                var transactionEntity = _mapper.Map<Payment>(transactionDto);
                await _repository.RemoveAsync(transactionEntity);

                result.Data = transactionDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Parcela do pagamento {transactionDto.Description} removida com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover a Parcela do pagamento {transactionDto?.Description} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> FindById(Guid? id)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                var transaction = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<PaymentDto>(transaction);
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
                    $"Não foi possível acessar os registros de Parcelas de Transação na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByTransactionId(
            Guid? transactionId
        )
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var transactions = await _repository.QueryAsync(
                    p => p.TransactionId == transactionId,
                    c => c.BusinessPartner,
                    o => o.Order
                );
                result.Data = _mapper
                    .Map<IEnumerable<PaymentDto>>(transactions)
                    .OrderBy(_ => _.Date);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Transação baseado no Transação {transactionId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        )
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var transactions = await _repository.QueryAsync(
                    p => p.BusinessPartnerId == businessPartnerId,
                    c => c.BusinessPartner,
                    o => o.Order
                );
                result.Data = _mapper
                    .Map<IEnumerable<PaymentDto>>(transactions)
                    .OrderBy(_ => _.Date);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Transação baseado no BusinessPartner {businessPartnerId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByOrderId(Guid? orderId)
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var transactions = await _repository.QueryAsync(
                    p => p.OrderId == orderId,
                    c => c.BusinessPartner,
                    o => o.Order
                );
                result.Data = _mapper
                    .Map<IEnumerable<PaymentDto>>(transactions)
                    .OrderBy(_ => _.Date);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Parcelas do Transação baseado no Pedido {orderId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods
    }
}
