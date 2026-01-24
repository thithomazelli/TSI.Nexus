using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;

namespace TSI.Friday.Services.Tests.Services
{
    public class OrderProductServiceTests
    {
        private readonly OrderProductService _service;
        private readonly Mock<IRepository<OrderProduct>> _repository;
        private readonly Mock<IRepository<Order>> _orderRepository;
        private readonly Mock<IRepository<Product>> _productRepository;
        private readonly IList<OrderProduct> _itemsMock;
        private readonly IMapper _mapper;

        public OrderProductServiceTests()
        {
            _repository = new Mock<IRepository<OrderProduct>>();
            _orderRepository = new Mock<IRepository<Order>>();
            _productRepository = new Mock<IRepository<Product>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _service = new OrderProductService(
                _repository.Object,
                _orderRepository.Object,
                _productRepository.Object,
                _mapper
            );

            _itemsMock = new List<OrderProduct>
            {
                new OrderProduct
                {
                    Id = 1,
                    Description = "Item1",
                    OrderId = 1,
                    ProductId = 1,
                },
                new OrderProduct
                {
                    Id = 2,
                    Description = "Item2",
                    OrderId = 1,
                    ProductId = 2,
                },
            };
        }

        [Fact]
        public async Task OrderProductService_Add_ShouldAddItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = new OrderProductDto
            {
                Id = 3,
                Description = "Item3",
                OrderId = 2,
                ProductId = 3,
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<OrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {itemDto.Description} cadastrado com sucesso.",
            };

            // Act
            var result = await _service.Add(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<OrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task OrderProductService_Update_ShouldUpdateItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<OrderProductDto>(_itemsMock.First());
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<OrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {itemDto.Description} atualizado com sucesso.",
            };

            // Act
            var result = await _service.Update(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<OrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task OrderProductService_Remove_ShouldRemoveItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<OrderProductDto>(_itemsMock.First());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<OrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {itemDto.Description} removido com sucesso.",
            };

            // Act
            var result = await _service.Remove(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<OrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task OrderProductService_FindByOrderId_ShouldReturnItems_WhenOrderIdIsValid()
        {
            // Arrange
            const int orderId = 1;
            var items = _itemsMock.Where(i => i.OrderId == orderId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<Func<OrderProduct, bool>>>()
                    )
                )
                .ReturnsAsync(items);

            var expected = new WebApiResponse<IEnumerable<OrderProductDto>>
            {
                Data = _mapper.Map<IEnumerable<OrderProductDto>>(items),
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _service.FindByOrderId(orderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<System.Linq.Expressions.Expression<Func<OrderProduct, bool>>>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderProductService_FindById_ShouldReturnItem_WhenIdIsValid()
        {
            // Arrange
            const int id = 1;
            var item = _itemsMock.First(i => i.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = _mapper.Map<OrderProductDto>(item),
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} encontrado com sucesso",
            };

            // Act
            var result = await _service.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }
    }
}
