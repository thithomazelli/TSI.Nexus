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
        private readonly IPaymentService _paymentService;
        private readonly IProductService _productService;
        private readonly ISequenceService _sequenceService;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// OrderService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Order> object used to initialize the internal variable using Dependency Injection.</param>
        public OrderService(
            IRepository<Order> repository,
            IPaymentService paymentService,
            IProductService productService,
            ISequenceService sequenceService,
            IMapper mapper
        )
        {
            _repository = repository;
            _paymentService = paymentService;
            _productService = productService;
            _sequenceService = sequenceService;
            _mapper = mapper;
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
                orderDto.Description = $"Pedido de Venda -  {orderDto.OrderNumber}";

                // Save Payment first (if provided) so we can assign PaymentId to Order before saving Order
                var paymentResult = new WebApiResponse<PaymentDto>();

                var paymentDto = orderDto.Payment;
                if (paymentDto != null)
                {
                    paymentDto.OrderNumber = orderDto.OrderNumber;
                    paymentDto.Description =
                        $"Pagamento do Pedido de Venda - {orderDto.OrderNumber}";
                    paymentResult = await _paymentService.Add(paymentDto);
                    orderDto.Payment = null;
                    orderDto.PaymentId = paymentResult.Data?.Id ?? null;
                }

                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.AddAsync(orderEntity);

                // Update Payment
                if (paymentResult?.Data != null)
                {
                    paymentResult.Data.OrderId = orderEntity.Id;

                    foreach (var payment in paymentResult.Data.Installments)
                    {
                        payment.OrderId = orderEntity.Id;
                    }

                    await _paymentService.Update(paymentResult.Data);
                }

                // adjust stock in batch if product service available
                if (orderEntity.OrderProducts.Any())
                {
                    var deltas = new Dictionary<Guid, int>();
                    foreach (var op in orderEntity.OrderProducts)
                    {
                        var pid = op.ProductId;
                        var delta = -Convert.ToInt32(op.Quantity);
                        if (deltas.ContainsKey(pid))
                        {
                            deltas[pid] += delta;
                        }
                        else
                        {
                            deltas[pid] = delta;
                        }
                    }

                    if (deltas.Count > 0)
                    {
                        await _productService.AdjustStockAsync(deltas);
                    }
                }

                // prepare response DTO
                var responseDto = _mapper.Map<OrderDto>(orderEntity);

                result.Data = responseDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
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
                // First update Order basic data (without handling Payment) to ensure it exists
                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.UpdateAsync(orderEntity);

                var paymentDto = orderDto.Payment;
                paymentDto.OrderId = orderEntity.Id;

                var updRes = await _paymentService.Update(paymentDto);
                if (updRes.Status == ResponseStatus.Success && updRes.Data != null)
                {
                    orderDto.Payment = updRes.Data;
                }

                result.Data = _mapper.Map<OrderDto>(orderEntity);
                result.Data.Payment = orderDto.Payment;

                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
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
                    p => p.Payment
                );

                if (orderEntity == null)
                {
                    result.Data = null;
                    result.Status = ResponseStatus.Error;
                    result.Message = $"Pedido {orderDto.OrderNumber} não encontrado.";
                    return result;
                }

                // compute deltas before removal
                if (orderEntity?.OrderProducts != null)
                {
                    var deltas = new Dictionary<Guid, int>();
                    foreach (var op in orderEntity.OrderProducts)
                    {
                        var pid = op.ProductId;
                        var delta = Convert.ToInt32(op.Quantity);
                        if (deltas.ContainsKey(pid))
                            deltas[pid] += delta;
                        else
                            deltas[pid] = delta;
                    }

                    if (deltas.Count > 0)
                    {
                        await _productService.AdjustStockAsync(deltas);
                    }
                }

                await _repository.RemoveAsync(orderEntity);

                var paymentDto = _mapper.Map<PaymentDto>(orderEntity.Payment);
                await _paymentService.Remove(paymentDto);

                result.Data = orderDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} removido com sucesso.";
            }
            catch (Exception ex)
            {
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
                var orders = await _repository.GetAllAsync(o => o.BusinessPartner);
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
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
                    p => p.Payment,
                    pi => pi.Payment.Installments
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
                    o => o.BusinessPartner
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
                var orders = await _repository.QueryAsync(o =>
                    o.BusinessPartnerId == businessPartnerId
                );
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
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
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Pedidos relacionados ao Produto {productId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private methods

        private static string BuildPrefixFromBusinessPartnerName(string? businessPartnerName)
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
