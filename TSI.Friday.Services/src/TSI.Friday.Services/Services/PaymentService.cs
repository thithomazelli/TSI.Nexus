using System.Linq;
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
        public async Task<WebApiResponse<PaymentDto>> Add(PaymentDto paymentDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                CreatePaymentInstallments(paymentDto);
                var paymentEntity = _mapper.Map<Payment>(paymentDto);
                await _repository.AddAsync(paymentEntity);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pagamento {paymentDto.Description} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Pagamento {paymentDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> Update(PaymentDto paymentDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                // Load tracked payment with installments from DB
                var existing = await _repository.GetByIdAsync(paymentDto.Id, p => p.Installments);
                if (existing == null)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Pagamento com Id {paymentDto.Id} não encontrado.";
                    return result;
                }

                // Normalize installments prices if overall price changed
                var existingInstallments =
                    existing.Installments?.ToList() ?? new List<PaymentInstallment>();
                var sumExisting = existingInstallments.Sum(x => x.Price);
                var count =
                    paymentDto.TotalOfInstallments > 0
                        ? paymentDto.TotalOfInstallments
                        : existingInstallments.Count;

                if (count > 0 && paymentDto.Price != sumExisting && existingInstallments.Count > 0)
                {
                    var part = Math.Round(paymentDto.Price / count, 2);
                    for (int i = 0; i < existingInstallments.Count; i++)
                    {
                        if (i < count - 1)
                        {
                            existingInstallments[i].Price = part;
                        }
                        else if (i == count - 1)
                        {
                            var remainder = paymentDto.Price - part * (count - 1);
                            existingInstallments[i].Price = Math.Round(remainder, 2);
                        }
                        else
                        {
                            existingInstallments[i].Price = 0m;
                        }
                    }
                }

                // Update installments statuses if requested (except already approved)
                var currentStatus = ComputeStatusFromInstallments(existingInstallments);
                //if (paymentDto.Status != currentStatus)
                //{
                //}

                foreach (
                    var inst in existingInstallments.Where(_ => _.Status != PaymentStatus.Approved)
                )
                {
                    if (inst.Date.ToUniversalTime().Date < DateTime.UtcNow.Date)
                    {
                        inst.Status = PaymentStatus.Delayed;
                    }
                }

                await _repository.UpdateAsync(existing);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pagamento {paymentDto.Description} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Pagamento {paymentDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> Remove(PaymentDto paymentDto)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                var paymentEntity = _mapper.Map<Payment>(paymentDto);
                await _repository.RemoveAsync(paymentEntity);

                result.Data = paymentDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pagamento {paymentDto.Description} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Pagamento {paymentDto?.Description} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var payments = await _repository.GetAllAsync(
                    c => c.BusinessPartner,
                    o => o.Order,
                    p => p.Installments
                );

                var paymentDtos = payments
                    .Select(p =>
                    {
                        var dto = _mapper.Map<PaymentDto>(p);
                        var price = ComputePriceFromInstallments(p.Installments);
                        var status = ComputeStatusFromInstallments(p.Installments);
                        dto.Price = price;
                        dto.Status = status;
                        return dto;
                    })
                    .ToList();

                result.Data = paymentDtos;
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Pagamentos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<PaymentDto>> FindById(int? id)
        {
            WebApiResponse<PaymentDto> result = new();

            try
            {
                var payment = await _repository.GetByIdAsync(id, p => p.Installments);

                if (payment == null)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Pagamento com Id {id} não encontrado.";
                    return result;
                }

                var dto = _mapper.Map<PaymentDto>(payment);
                var price = ComputePriceFromInstallments(payment.Installments);
                var status = ComputeStatusFromInstallments(payment.Installments);
                dto.Price = price;
                dto.Status = status;

                result.Data = dto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Pagamento {result.Data.Description} encontrado com sucesso"
                        : $"Nenhum Pagamento com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Pagamentos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByBusinessPartnerId(
            int? businessPartnerId
        )
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var payments = await _repository.QueryAsync(
                    p => p.BusinessPartnerId == businessPartnerId,
                    p => p.Installments
                );
                var paymentDtos = payments
                    .Select(p =>
                    {
                        var dto = _mapper.Map<PaymentDto>(p);
                        var price = ComputePriceFromInstallments(p.Installments);
                        var status = ComputeStatusFromInstallments(p.Installments);
                        dto.Price = price;
                        dto.Status = status;
                        return dto;
                    })
                    .ToList();

                result.Data = paymentDtos;
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Pagamentos do BusinessPartnere {businessPartnerId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Create the installments for a given PaymentDto based on its TotalOfInstallments property
        /// and add them to the Installments collection of the PaymentDto.
        /// </summary>
        /// <param name="paymentDto">PaymentDto object</param>
        private static void CreatePaymentInstallments(PaymentDto paymentDto)
        {
            for (var i = 1; i <= (paymentDto.TotalOfInstallments); i++)
            {
                var originalDate = paymentDto.Date;
                var nextMonth = originalDate.AddMonths(i - 1);
                var installment = new PaymentInstallmentDto
                {
                    Type = paymentDto.Type,
                    Status = paymentDto.Status,
                    Method = paymentDto.Method,
                    Date = i == 1 ? originalDate : nextMonth,
                    Description =
                        $"{paymentDto.Description} - {i}/{paymentDto.TotalOfInstallments}",
                    InstallmentNumber = i,
                    Price =
                        paymentDto.Price != 0 && paymentDto.TotalOfInstallments > 0
                            ? paymentDto.Price / paymentDto.TotalOfInstallments
                            : paymentDto.Price,
                    OrderId = paymentDto.OrderId,
                    BusinessPartnerId = paymentDto.BusinessPartnerId,
                };

                if (
                    installment.Status != PaymentStatus.Approved
                    && installment.Date.ToUniversalTime().Date < DateTime.UtcNow.Date
                )
                {
                    installment.Status = PaymentStatus.Delayed;
                }

                paymentDto.Installments.Add(installment);
            }
        }

        /// <summary>
        /// Computes the total price from a collection of payment installments.
        /// </summary>
        /// <param name="installments">Installments object</param>
        /// <returns>The total price calculated from the installments</returns>
        private static decimal ComputePriceFromInstallments(
            IEnumerable<PaymentInstallment>? installments
        )
        {
            var list = installments?.ToList() ?? new List<PaymentInstallment>();
            return list.Sum(i => i.Price);
        }

        /// <summary>
        /// Computes the status from a collection of payment installments.
        /// </summary>
        /// <param name="installments">Installments object</param>
        /// <returns>The status calculated from the installments</returns>
        private static PaymentStatus ComputeStatusFromInstallments(
            IEnumerable<PaymentInstallment>? installments
        )
        {
            var list = installments?.ToList() ?? [];

            if (!list.Any())
            {
                return PaymentStatus.Pending;
            }

            if (list.All(i => i.Status == PaymentStatus.Approved))
            {
                return PaymentStatus.Approved;
            }

            var pendingInstallments = list.Where(i => i.Status != PaymentStatus.Approved).ToList();
            if (pendingInstallments.Any())
            {
                var today = DateTime.UtcNow.Date;
                var anyOverdue = pendingInstallments.Any(pi =>
                    pi.Date.ToUniversalTime().Date < today
                );
                return anyOverdue ? PaymentStatus.Delayed : PaymentStatus.Pending;
            }

            if (list.Any(i => i.Status == PaymentStatus.Delayed))
            {
                return PaymentStatus.Delayed;
            }

            return PaymentStatus.Pending;
        }

        #endregion Public methods
    }
}
