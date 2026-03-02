using System.Text.Json.Nodes;
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
        private readonly string[] _monthNamesAbbr =
        {
            "Jan",
            "Fev",
            "Mar",
            "Abr",
            "Mai",
            "Jun",
            "Jul",
            "Ago",
            "Set",
            "Out",
            "Nov",
            "Dez",
        };
        private readonly string[] _monthNamesFull =
        {
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
        };

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

        /// <inheritdoc />
        public async Task<WebApiResponse<JsonObject>> GetPaymentsHistory(
            DateTime? start = null,
            DateTime? end = null
        )
        {
            WebApiResponse<JsonObject> result = new();

            try
            {
                var transactions = await _repository.GetAllAsync();

                // Determine period: if start/end provided use them (normalize to month start/end), otherwise last12 months
                DateTime now = DateTime.UtcNow.Date;
                DateTime firstOfCurrentMonth = new DateTime(now.Year, now.Month, 1);

                var months = Enumerable
                    .Range(0, 12)
                    .Select(i => firstOfCurrentMonth.AddMonths(i - 11))
                    .ToList();
                DateTime periodStart = months.First();
                DateTime periodEnd = firstOfCurrentMonth.AddMonths(1);

                if (start.HasValue && end.HasValue)
                {
                    // Normalize provided dates to month boundaries
                    var s = start.Value.ToUniversalTime();
                    var e = end.Value.ToUniversalTime();

                    periodStart = new DateTime(s.Year, s.Month, 1);
                    // periodEnd should be first day of month after 'end'
                    var endMonthFirst = new DateTime(e.Year, e.Month, 1);
                    periodEnd = endMonthFirst.AddMonths(1);

                    // Rebuild months list based on provided range (inclusive months)
                    var monthCount =
                        ((periodEnd.Year - periodStart.Year) * 12)
                        + periodEnd.Month
                        - periodStart.Month;
                    months = Enumerable
                        .Range(0, monthCount)
                        .Select(i => periodStart.AddMonths(i))
                        .ToList();
                }

                // filtra apenas o período relevante e normaliza datas para o primeiro dia do mês
                var filtered = transactions
                    .Where(t =>
                    {
                        var dt = t.Date.ToUniversalTime();
                        return dt >= periodStart && dt < periodEnd;
                    })
                    .Select(t => new
                    {
                        t.Type,
                        Month = new DateTime(
                            t.Date.ToUniversalTime().Year,
                            t.Date.ToUniversalTime().Month,
                            1
                        ),
                        t.Price,
                    });

                // agrupa por (Type, Month) e soma preços
                var grouped = filtered
                    .GroupBy(x => (x.Type, x.Month))
                    .ToDictionary(g => g.Key, g => g.Sum(x => x.Price));

                // gera as arrays na ordem dos meses (sem foreach)
                var incomingNodes = months
                    .Select(m =>
                        (JsonNode)
                            JsonValue.Create(
                                grouped.TryGetValue((TransactionType.Incoming, m), out var v)
                                    ? v
                                    : 0m
                            )
                    )
                    .ToArray();
                var outgoingNodes = months
                    .Select(m =>
                        (JsonNode)
                            JsonValue.Create(
                                grouped.TryGetValue((TransactionType.Outgoing, m), out var v)
                                    ? v
                                    : 0m
                            )
                    )
                    .ToArray();

                var response = new JsonObject
                {
                    ["incoming"] = new JsonArray(incomingNodes),
                    ["outgoing"] = new JsonArray(outgoingNodes),
                    ["categories"] = BuildCategoriesJson(months),
                    ["monthsData"] = BuildMonthsDataJson(months),
                };

                result.Data = response;
                result.Status = ResponseStatus.Success;
                result.Message = "Histórico de pagamentos gerado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os dados no banco de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<PaymentDto>>> FindDelayed()
        {
            WebApiResponse<IEnumerable<PaymentDto>> result = new();

            try
            {
                var todayUtc = DateTime.UtcNow.Date;

                var items = await _repository.QueryAsync(
                    p => p.Status == PaymentStatus.Delayed
                    || (p.Status != PaymentStatus.Approved && p.Date.ToUniversalTime().Date < todayUtc),
                    c => c.BusinessPartner,
                    o => o.Order
                );

                result.Data = _mapper.Map<IEnumerable<PaymentDto>>(items).OrderBy(_ => _.Date);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Parcelas de Transação. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        private JsonArray BuildCategoriesJson(IList<DateTime> months)
        {
            var arr = months
                .Select(m => JsonValue.Create($"{_monthNamesAbbr[m.Month - 1]} {m.Year}"))
                .Cast<JsonNode>()
                .ToArray();
            return new JsonArray(arr);
        }

        private JsonArray BuildMonthsDataJson(IList<DateTime> months)
        {
            var nodes = months
                .Select(m =>
                {
                    var obj = new JsonObject
                    {
                        ["abbr"] = JsonValue.Create(_monthNamesAbbr[m.Month - 1]),
                        ["full"] = JsonValue.Create(_monthNamesFull[m.Month - 1]),
                        ["yyyy"] = JsonValue.Create(m.Year),
                    };
                    return (JsonNode)obj;
                })
                .ToArray();

            return new JsonArray(nodes);
        }

        #endregion Private methods
    }
}
