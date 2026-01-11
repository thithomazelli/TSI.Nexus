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
        /// Repository object created to access the Order registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Order> _repository;
        private readonly IMapper _mapper;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// OrderService constructor created to initialize the "_repository" using Dependency Injection.
        /// </summary>
        /// <param name="repository">IRepository<Order> object used to initialize the internal variable using Dependency Injection.</param>
        public OrderService(IRepository<Order> repository, IMapper mapper)
        {
            _repository = repository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Add(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.AddAsync(orderEntity);

                result.Data = orderDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} cadastrado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível cadastrar o Pedido {orderDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Update(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.UpdateAsync(orderEntity);

                result.Data = orderDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível atualizar os dados do Pedido {orderDto?.OrderNumber} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> Remove(OrderDto orderDto)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var orderEntity = _mapper.Map<Order>(orderDto);
                await _repository.RemoveAsync(orderEntity);

                result.Data = orderDto;
                result.Status = ResponseStatus.Success;
                result.Message = $"Pedido {orderDto.OrderNumber} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível remover o Pedido {orderDto?.OrderNumber} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.GetAllAsync();
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Pedidos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> FindById(int? id)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var order = await _repository.GetByIdAsync(id);
                result.Data = _mapper.Map<OrderDto>(order);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Pedido {result.Data.OrderNumber} encontrado com sucesso"
                    : $"Nenhum Pedido com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os registros de Pedidos na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<OrderDto>> FindByOrderNumber(string orderNumber)
        {
            WebApiResponse<OrderDto> result = new();

            try
            {
                var order = await _repository.FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
                result.Data = _mapper.Map<OrderDto>(order);
                result.Status = ResponseStatus.Success;
                result.Message = result.Data != null
                    ? $"Pedido {result.Data.OrderNumber} encontrado com sucesso"
                    : $"Nenhum Pedido com o número {orderNumber} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível buscar o Pedido pelo número {orderNumber}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindByClientId(int? clientId)
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.QueryAsync(o => o.ClientId == clientId);
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os Pedidos do Cliente {clientId}. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<OrderDto>>> FindByProductId(int? productId)
        {
            WebApiResponse<IEnumerable<OrderDto>> result = new();

            try
            {
                var orders = await _repository.QueryAsync(o => o.OrderProducts.Any(op => op.ProductId == productId));
                result.Data = _mapper.Map<IEnumerable<OrderDto>>(orders);
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data?.Count() ?? 0} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message = $"Não foi possível acessar os Pedidos relacionados ao Produto {productId}. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion Public methods
    }
}