using System.Text.RegularExpressions;
using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class OrderService : IOrderService
    {
        #region Properties

        /// <summary>
        /// OrderService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        private readonly IRepository<Order> _repository;
        private readonly IRepository<OrderProduct> _orderProductRepository;
        private readonly ITransactionService _transactionService;
        private readonly ISequenceService _sequenceService;
        private readonly IMapper _mapper;
        private readonly ILogService _logService;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// OrderService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Order> object used to initialize the internal variable using Dependency Injection.</param>
        public OrderService(
            IRepository<Order> repository,
            IRepository<OrderProduct> orderProductRepository,
            ITransactionService transactionService,
            ISequenceService sequenceService,
            IMapper mapper,
            ILogService logService
        )
        {
            _repository = repository;
            _orderProductRepository = orderProductRepository;
            _transactionService = transactionService;
            _sequenceService = sequenceService;
            _mapper = mapper;
            _logService = logService;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Add(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var prefix = BuildPrefixFromBusinessPartnerName(orderDto.BusinessPartnerName);
                var next = await _sequenceService.GetNextValue("OrderNumberSeq");
                orderDto.OrderNumber = $"{prefix}-{next:D5}";
                orderDto.Description = string.IsNullOrEmpty(orderDto.Description)
                    ? $"Pedido de Venda -  {orderDto.OrderNumber}"
                    : orderDto.Description;

                // Save Transaction first (if provided) so we can assign TransactionId to Order before saving Order
                var transactionResult = new WebApiResponse<TransactionDto>();

                var transactionDto = orderDto.Transaction;
                if (transactionDto != null)
                {
                    transactionDto.OrderNumber = orderDto.OrderNumber;
                    transactionDto.Description =
                        $"Transação do Pedido de Venda - {orderDto.OrderNumber}";
                    transactionResult = await _transactionService.Add(transactionDto);
                    orderDto.Transaction = null;
                    orderDto.TransactionId = transactionResult.Data?.Id ?? null;
                }
                else if (orderDto.TransactionId != null)
                {
                    // If TransactionId was provided without full Transaction data, we can try to fetch it to ensure it exists and get its OrderId if already set
                    transactionResult = await _transactionService.FindById(
                        orderDto.TransactionId.Value
                    );
                    if (
                        transactionResult.Status == ResponseStatus.Success
                        && transactionResult.Data != null
                    )
                    {
                        orderDto.TransactionId = transactionResult.Data.Id;
                    }
                }

                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.AddAsync(orderEntity);

                // Update Transaction
                if (transactionResult?.Data != null)
                {
                    transactionResult.Data.OrderId = orderEntity.Id;
                    await _transactionService.UpdateOrderId(transactionResult.Data);
                }

                // prepare response DTO
                var responseDto = _mapper.Map<OrderDto>(orderEntity);

                result.Data = responseDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.Add", orderDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Pedido {orderDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Update(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                // First update Order basic data (without handling Transaction) to ensure it exists
                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.UpdateAsync(orderEntity);

                if (orderDto.Transaction != null)
                {
                    var transactionDto = orderDto.Transaction;
                    transactionDto.OrderId = orderEntity.Id;

                    var updRes = await _transactionService.Update(transactionDto);
                    if (updRes.Status == ResponseStatus.Success && updRes.Data != null)
                    {
                        orderDto.Transaction = updRes.Data;
                    }
                }

                // If UI requested marking all order products as returned, perform bulk update via repository
                if (orderDto.MarkAllProductsAsReturned)
                {
                    // Use ExecuteUpdateAsync to update all non-returned order products for this order in a single operation when possible
                    await _orderProductRepository.ExecuteUpdateAsync(
                        op =>
                            op.OrderId == orderEntity.Id
                            && op.Status != OrderProductStatus.Returned,
                        op => op.Status = OrderProductStatus.Returned
                    );
                }

                result.Data = _mapper.Map<OrderDto>(orderEntity);
                result.Data.Transaction = orderDto.Transaction;

                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.Update", orderDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Pedido {orderDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Remove(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var orderEntity = await _repository.GetByIdAsync(
                    orderDto.Id,
                    o => o.OrderProducts,
                    p => p.Transaction
                );

                if (orderEntity == null)
                {
                    _logService.LogException(
                        new Exception($"Pedido {orderDto.OrderNumber} não encontrado."),
                        "OrderService.Remove",
                        orderDto
                    );
                    result.Data = null;
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Pedido {orderDto.OrderNumber} não encontrado.";
                    return result;
                }

                await _repository.RemoveAsync(orderEntity);

                var transactionDto = _mapper.Map<TransactionDto>(orderEntity.Transaction);
                await _transactionService.Remove(transactionDto);

                result.Data = orderDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} removido com sucesso.";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.Remove", orderDto);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Pedido {orderDto?.OrderNumber} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.GetAllAsync(
                    o => o.BusinessPartner,
                    o => o.OrderProducts,
                    t => t.Transaction,
                    p => p.Payments
                );

                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.FindAll", null);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Pedidos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> FindById(Guid? id)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var order = await _repository.GetByIdAsync(
                    id,
                    o => o.BusinessPartner,
                    op => op.OrderProducts,
                    t => t.Transaction,
                    p => p.Transaction.Payments
                );

                result.Data = _mapper.Map<OrderDto>(order);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Pedido {result.Data.OrderNumber} encontrado com sucesso"
                        : $"Nenhum Pedido com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.FindById", id);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Pedidos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> FindByOrderNumber(string orderNumber)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var order = await _repository.FirstOrDefaultAsync(
                    o => o.OrderNumber == orderNumber,
                    o => o.BusinessPartner,
                    p => p.Transaction
                );

                result.Data = _mapper.Map<OrderDto>(order);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Pedido {result.Data.OrderNumber} encontrado com sucesso"
                        : $"Nenhum Pedido com o número {orderNumber} foi encontrado";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.FindByOrderNumber", orderNumber);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível buscar o Pedido pelo número {orderNumber}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        )
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.QueryAsync(
                    o => o.BusinessPartnerId == businessPartnerId,
                    p => p.Transaction
                );
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(
                    ex,
                    "OrderService.FindByBusinessPartnerId",
                    businessPartnerId
                );
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Pedidos do BusinessPartner {businessPartnerId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindByProductId(Guid? productId)
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.QueryAsync(o =>
                    o.OrderProducts.Any(op => op.ProductId == productId)
                );
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                _logService.LogException(ex, "OrderService.FindByProductId", productId);
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Pedidos relacionados ao Produto {productId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        private static string BuildPrefixFromBusinessPartnerName(string businessPartnerName)
        {
            // Remove non-letter characters and whitespace, keep only A-Z letters
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
