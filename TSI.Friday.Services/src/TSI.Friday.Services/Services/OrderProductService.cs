using AutoMapper;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services
{
    public class OrderProductService : IOrderProductService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the OrderProduct registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<OrderProduct> _repository;
        private readonly IRepository<Order> _orderRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// OrderProductService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<OrderProduct> object used to initialize the internal variable using Dependency Injection.</param>
        public OrderProductService(
            IRepository<OrderProduct> repository,
            IRepository<Order> orderRepository,
            IRepository<Product> productRepository,
            IMapper mapper
        )
        {
            _repository = repository;
            _orderRepository = orderRepository;
            _productRepository = productRepository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderProductDto>> Update(OrderProductDto orderProductDto)
        {
            WebApiResponse<OrderProductDto> result = new();

            try
            {
                var entity = _mapper.Map<OrderProduct>(orderProductDto);
                await _repository.UpdateAsync(entity);

                var newQuantity = Convert.ToInt32(
                    orderProductDto.PreviousQuantity - orderProductDto.Quantity
                );

                if (newQuantity != 0)
                {
                    await ChangeProductStockAsync(orderProductDto.ProductId, newQuantity);
                }

                // Recalculate order price and update order
                await RecalculateAndUpdateOrderAsync(orderProductDto.OrderId);

                result.Data = orderProductDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Item do Pedido {orderProductDto.Description} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Item do Pedido {orderProductDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderProductDto>> Add(OrderProductDto orderProductDto)
        {
            WebApiResponse<OrderProductDto> result = new();

            try
            {
                var orderProductEntity = _mapper.Map<OrderProduct>(orderProductDto);

                await _repository.AddAsync(orderProductEntity);

                // Update product stock: subtract quantity
                await ChangeProductStockAsync(
                    orderProductEntity.ProductId,
                    -Convert.ToInt32(orderProductEntity.Quantity)
                );

                // Recalculate order price and update order
                await RecalculateAndUpdateOrderAsync(orderProductEntity.OrderId);

                result.Data = orderProductDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Item do Pedido {orderProductDto.Description} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível cadastrar o Item do Pedido {orderProductDto?.Description} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderProductDto>> Remove(OrderProductDto orderProductDto)
        {
            WebApiResponse<OrderProductDto> result = new();

            try
            {
                var existing = await _repository.GetByIdAsync(orderProductDto.Id);

                await _repository.RemoveAsync(existing);

                // Add back quantity to product
                await ChangeProductStockAsync(
                    existing.ProductId,
                    Convert.ToInt32(existing.Quantity)
                );

                // Recalculate order price and update order
                await RecalculateAndUpdateOrderAsync(existing.OrderId);

                result.Data = orderProductDto;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"Item do Pedido {orderProductDto.Description} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Item do Pedido {orderProductDto?.Description} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderProductDto>>> FindByOrderId(int? orderId)
        {
            WebApiResponse<IEnumerable<OrderProductDto>> result = new();

            try
            {
                var items = await _repository.QueryAsync(
                    op => op.OrderId == orderId,
                    op => op.Order,
                    op => op.Product
                );
                result.Data = _mapper.Map<IEnumerable<OrderProductDto>>(items);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os Itens do Pedido {orderId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderProductDto>> FindById(int? id)
        {
            WebApiResponse<OrderProductDto> result = new();

            try
            {
                var item = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<OrderProductDto>(item);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Item do Pedido {result.Data.Description} encontrado com sucesso"
                        : $"Nenhum Item do Pedido com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Itens do Pedido na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods

        #region Private helpers

        private async Task ChangeProductStockAsync(int productId, int delta)
        {
            var product = await _productRepository.GetByIdAsync(productId);
            product.QuantityInStock = product.QuantityInStock + delta;
            await _productRepository.UpdateAsync(product);
        }

        private async Task RecalculateAndUpdateOrderAsync(int orderId)
        {
            var items = await _repository.QueryAsync(op => op.OrderId == orderId);
            var sum = items.Sum(op =>
                (op.Price * op.Quantity) - ((op.Price * op.Quantity) * op.Discount / 100m)
            );

            var order = await _orderRepository.GetByIdAsync(orderId);
            order.Price = sum;
            await _orderRepository.UpdateAsync(order);
        }

        #endregion Private helpers
    }
}
