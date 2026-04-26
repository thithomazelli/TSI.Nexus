using System.Text.RegularExpressions;
using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class QuoteService : IQuoteService
    {
        #region Properties

        private readonly IRepository<Quote> _repository;
        private readonly IRepository<QuoteProduct> _quoteProductRepository;
        private readonly ISequenceService _sequenceService;
        private readonly IMapper _mapper;
        private readonly ILogService _logService; // keep original name matched with other files
        private readonly IRepository<Product> _productRepository;
        private readonly IOrderService _orderService; // keep original name matched with other files
        #endregion Properties

        #region Public methods

        public QuoteService(
            IRepository<Quote> repository,
            IRepository<QuoteProduct> quoteProductRepository,
            ISequenceService sequenceService,
            IMapper mapper,
            ILogService logService,
            IRepository<Product> productRepository,
            IOrderService orderService
        )
        {
            _repository = repository;
            _quoteProductRepository = quoteProductRepository;
            _sequenceService = sequenceService;
            _mapper = mapper;
            _logService = logService; // keep original name matched with other files
            _productRepository = productRepository;
            _orderService = orderService; // keep original name matched with other files
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<QuoteDto>> Add(QuoteDto quoteDto)
        {
            WebApiResponse<QuoteDto> result = new();

            try
            {
                var prefix = BuildPrefixFromBusinessPartnerName(quoteDto.BusinessPartnerName);
                var next = await _sequenceService.GetNextValue("QuoteNumberSeq");
                quoteDto.OrderNumber = $"{prefix}-Q{next:D5}";
                quoteDto.Description = string.IsNullOrEmpty(quoteDto.Description)
                    ? $"Orçamento - {quoteDto.OrderNumber}"
                    : quoteDto.Description;

                var entity = _mapper.Map<Quote>(quoteDto);
                await _repository.AddAsync(entity);

                var responseDto = _mapper.Map<QuoteDto>(entity);

                result.Data = responseDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Orçamento {quoteDto.OrderNumber} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.Add", quoteDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Orçamento {quoteDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<QuoteDto>> Update(QuoteDto quoteDto)
        {
            WebApiResponse<QuoteDto> result = new();

            try
            {
                var entity = _mapper.Map<Quote>(quoteDto);
                await _repository.UpdateAsync(entity);

                result.Data = _mapper.Map<QuoteDto>(entity);
                result.Status = ResponseStatus.Success;
                result.Message = $"Orçamento {quoteDto.OrderNumber} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.Update", quoteDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Orçamento {quoteDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<QuoteDto>> Remove(QuoteDto quoteDto)
        {
            WebApiResponse<QuoteDto> result = new();

            try
            {
                var entity = await _repository.GetByIdAsync(quoteDto.Id, q => q.QuoteProducts);

                if (entity == null)
                {
                    _logService.LogException(
                        new Exception($"Orçamento {quoteDto.OrderNumber} não encontrado."),
                        "QuoteService.Remove",
                        quoteDto
                    );
                    result.Data = null;
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Orçamento {quoteDto.OrderNumber} não encontrado.";
                    return result;
                }

                await _repository.RemoveAsync(entity);

                result.Data = quoteDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Orçamento {quoteDto.OrderNumber} removido com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.Remove", quoteDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Orçamento {quoteDto?.OrderNumber} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<QuoteDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<QuoteDto>> result = new();

            try
            {
                var quotes = await _repository.GetAllAsync(
                    q => q.BusinessPartner,
                    q => q.QuoteProducts
                );

                result.Data = _mapper.Map<IEnumerable<QuoteDto>>(quotes);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.FindAll", null);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Orçamentos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<QuoteDto>> FindById(Guid? id)
        {
            WebApiResponse<QuoteDto> result = new();

            try
            {
                var quote = await _repository.GetByIdAsync(
                    id,
                    q => q.BusinessPartner,
                    q => q.QuoteProducts
                );

                result.Data = _mapper.Map<QuoteDto>(quote);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Orçamento {result.Data.OrderNumber} encontrado com sucesso"
                        : $"Nenhum Orçamento com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.FindById", id);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Orçamentos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<QuoteDto>> FindByQuoteNumber(string quoteNumber)
        {
            WebApiResponse<QuoteDto> result = new();

            try
            {
                var quote = await _repository.FirstOrDefaultAsync(
                    q => q.QuoteNumber == quoteNumber,
                    q => q.BusinessPartner
                );

                result.Data = _mapper.Map<QuoteDto>(quote);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Orçamento {result.Data.OrderNumber} encontrado com sucesso"
                        : $"Nenhum Orçamento com o número {quoteNumber} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.FindByQuoteNumber", quoteNumber);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível buscar o Orçamento pelo número {quoteNumber}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<QuoteDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        )
        {
            WebApiResponse<IEnumerable<QuoteDto>> result = new();

            try
            {
                var quotes = await _repository.QueryAsync(q =>
                    q.BusinessPartnerId == businessPartnerId
                );
                result.Data = _mapper.Map<IEnumerable<QuoteDto>>(quotes);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(
                    ex,
                    "QuoteService.FindByBusinessPartnerId",
                    businessPartnerId
                );
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Orçamentos do BusinessPartner {businessPartnerId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<QuoteDto>>> FindByProductId(Guid? productId)
        {
            WebApiResponse<IEnumerable<QuoteDto>> result = new();

            try
            {
                var quotes = await _repository.QueryAsync(q =>
                    q.QuoteProducts.Any(qp => qp.ProductId == productId)
                );
                result.Data = _mapper.Map<IEnumerable<QuoteDto>>(quotes);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.FindByProductId", productId);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Orçamentos relacionados ao Produto {productId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> ConvertToOrder(QuoteDto quoteDto)
        {
            var result = new WebApiResponse<OrderDto>();

            try
            {
                if (quoteDto == null)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = "Quote inválido.";
                    return result;
                }

                var outOfStock = new List<string>();
                var outOfStockIds = new HashSet<Guid>();

                foreach (var item in quoteDto.QuoteProducts ?? Enumerable.Empty<QuoteProductDto>())
                {
                    if (
                        item.ProductType == ProductType.Sale
                        || item.ProductType == ProductType.Rental
                    )
                    {
                        var product = await _productRepository.GetByIdAsync(item.ProductId);
                        var available = product?.QuantityInStock ?? 0;
                        if (item.Quantity > available)
                        {
                            outOfStock.Add(
                                $"{item.ProductName ?? item.ProductSku} (necessário {item.Quantity}, disponível {available})"
                            );
                            outOfStockIds.Add(item.ProductId);
                        }
                    }
                }

                // Map all QuoteProducts -> OrderProductDtos
                var allOrderProducts =
                    quoteDto
                        .QuoteProducts?.Select(qp => new OrderProductDto
                        {
                            Id = qp.Id,
                            ProductId = qp.ProductId,
                            ProductName = qp.ProductName,
                            ProductSku = qp.ProductSku,
                            Quantity = qp.Quantity,
                            PreviousQuantity = qp.PreviousQuantity,
                            Discount = qp.Discount,
                            Price = qp.Price,
                            TotalPrice = qp.TotalPrice,
                            ProductType = qp.ProductType,
                            Status = qp.Status,
                            BusinessPartnerId = quoteDto.BusinessPartnerId,
                            BusinessPartnerName = quoteDto.BusinessPartnerName,
                        })
                        .ToList()
                    ?? new List<OrderProductDto>();

                // Build filtered list excluding out-of-stock items
                var filteredOrderProducts = allOrderProducts
                    .Where(op => !outOfStockIds.Contains(op.ProductId))
                    .ToList();

                // Map QuoteDto -> OrderDto (use filtered products)
                var orderDto = new OrderDto
                {
                    BusinessPartnerId = quoteDto.BusinessPartnerId,
                    BusinessPartnerName = quoteDto.BusinessPartnerName,
                    Date = DateTime.UtcNow,
                    Description = quoteDto.Description,
                    Discount = quoteDto.Discount,
                    Price = quoteDto.Price,
                    TotalPrice = quoteDto.TotalPrice,
                    QuoteId = quoteDto.Id,
                    QuoteNumber = quoteDto.OrderNumber,
                    OrderProducts = filteredOrderProducts,
                };

                // If there are out of stock items, return a warning and include the filtered DTO in Data (unless none remain)
                if (outOfStock.Any())
                {
                    result.Status = ResponseStatus.Warning;
                    result.Message =
                        "Alguns produtos não possuem quantidade suficiente em estoque: "
                        + string.Join(", ", outOfStock)
                        + ". Deseja prosseguir sem eles?";
                    result.Data = filteredOrderProducts.Any() ? orderDto : null;

                    return result;
                }

                // If quote exists in DB, try to build a TransactionDto from its payment fields
                if (quoteDto.Id != Guid.Empty)
                {
                    var quoteEntity = await _repository.GetByIdAsync(quoteDto.Id);
                    if (quoteEntity != null)
                    {
                        // Only create transaction when there is some payment/expense info
                        if (
                            quoteEntity.TotalOfPayments > 0
                            || quoteEntity.PaymentTotalPrice > 0m
                            || quoteEntity.TotalOfExpenses > 0
                            || quoteEntity.ExpenseTotalPrice > 0m
                        )
                        {
                            var transactionDto = new TransactionDto
                            {
                                Date = DateTime.UtcNow,
                                Description =
                                    $"Transação do Pedido a partir do Orçamento {quoteEntity.QuoteNumber}",
                                TotalOfPayments = quoteEntity.TotalOfPayments,
                                PaymentTotalPrice = quoteEntity.PaymentTotalPrice,
                                TotalOfExpenses = quoteEntity.TotalOfExpenses,
                                ExpenseTotalPrice = quoteEntity.ExpenseTotalPrice,
                                Condition = quoteEntity.Condition,
                                Method = quoteEntity.Method,
                                BusinessPartnerId = quoteEntity.BusinessPartnerId,
                                BusinessPartnerName = quoteEntity.BusinessPartner?.Name,
                                OrderNumber = orderDto.OrderNumber,
                                // set Type based on presence of payments/expenses
                                Type =
                                    quoteEntity.PaymentTotalPrice > 0m
                                        ? PaymentType.Incoming
                                        : PaymentType.Outgoing,
                            };

                            orderDto.Transaction = transactionDto;
                        }
                    }
                }

                // Call OrderService.Add
                var addResult = await _orderService.Add(orderDto);
                return addResult;
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "QuoteService.ConvertToOrder", quoteDto);
                result.Status = ResponseStatus.Error;
                result.Message = "Erro ao converter orçamento para pedido. " + ex.Message;
                return result;
            }
        }

        #endregion Public methods

        #region Private methods

        private static string BuildPrefixFromBusinessPartnerName(string businessPartnerName)
        {
            var cleaned = string.Empty;
            if (!string.IsNullOrWhiteSpace(businessPartnerName))
            {
                cleaned = Regex.Replace(businessPartnerName.Normalize(), "[^A-Za-z]", string.Empty);
                cleaned = cleaned.ToUpperInvariant();
            }

            var letters = cleaned ?? string.Empty;

            char GetRandomLetter()
            {
                var rnd = Random.Shared;
                return (char)('A' + rnd.Next(0, 26));
            }

            string prefix;

            if (letters.Length >= 3)
            {
                var first = letters[0];
                var middle = letters[letters.Length / 2];
                var last = letters[letters.Length - 1];
                prefix = string.Concat(first, middle, last);
            }
            else
            {
                var chars = new List<char>();
                for (int i = 0; i < letters.Length; i++)
                    chars.Add(letters[i]);

                while (chars.Count < 3)
                    chars.Add(GetRandomLetter());

                prefix = new string(chars.ToArray());
            }

            return prefix;
        }

        #endregion Private methods
    }
}
