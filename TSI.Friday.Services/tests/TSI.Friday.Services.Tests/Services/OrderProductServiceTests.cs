using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;
using TSI.Friday.Repository;

namespace TSI.Friday.Services.Tests.Services
{
    public class OrderProductServiceTests
    {
        private readonly OrderProductService _orderProductService;
        private readonly Mock<IRepository<OrderProduct>> _repository;
        private readonly Mock<IRepository<Order>> _orderRepository;
        private readonly IList<OrderProduct> _itemsMock;
        private readonly IMapper _mapper;

        public OrderProductServiceTests()
        {
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();

            _repository = new Mock<IRepository<OrderProduct>>();
            _orderRepository = new Mock<IRepository<Order>>();

            _orderProductService = new OrderProductService(
                _repository.Object,
                _orderRepository.Object,
                _mapper
            );

            _itemsMock = new List<OrderProduct>
            {
                new OrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Item1",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new OrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Item2",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
            };
        }

        [Fact]
        public async Task OrderProductService_Add_ShouldAddItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = new OrderProductDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Item3",
                OrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
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
            var result = await _orderProductService.Add(itemDto);

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
            var result = await _orderProductService.Update(itemDto);

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
                .Setup(_ => _.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new OrderProduct());
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
            var result = await _orderProductService.Remove(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<OrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task OrderProductService_FindByOrderId_ShouldReturnItems_WhenOrderIdIsValid()
        {
            // Arrange
            var orderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.OrderId == orderId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Product,
                        op => op.Address
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
            var result = await _orderProductService.FindByOrderId(orderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Product,
                        op => op.Address
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderProductService_FindById_ShouldReturnItem_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var item = _itemsMock.First(i => i.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

            var expected = new WebApiResponse<OrderProductDto>
            {
                Data = _mapper.Map<OrderProductDto>(item),
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido {item.Description} encontrado com sucesso",
            };

            // Act
            var result = await _orderProductService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }
    }
}
