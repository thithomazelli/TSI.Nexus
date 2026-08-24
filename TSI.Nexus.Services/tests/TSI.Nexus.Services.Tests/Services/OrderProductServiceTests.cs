using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;
using TSI.Nexus.Repository;
using Microsoft.Extensions.Logging;

namespace TSI.Nexus.Services.Tests.Services
{
    public class OrderProductServiceTests
    {
        private readonly OrderProductService _orderProductService;
        private readonly Mock<IRepository<OrderProduct>> _repository;
        private readonly Mock<IRepository<Order>> _orderRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;
        private readonly IList<OrderProduct> _itemsMock;

        public OrderProductServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _mapper = config.CreateMapper();

            _repository = new Mock<IRepository<OrderProduct>>();
            _orderRepository = new Mock<IRepository<Order>>();
            _logService = new Mock<ILogService>();

            _orderProductService = new OrderProductService(
                _repository.Object,
                _orderRepository.Object,
                _mapper,
                _logService.Object
            );

            _itemsMock = new List<OrderProduct>
            {
                new OrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Item1",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Status = OrderProductStatus.InProgress,
                    EndDate = DateTime.UtcNow.Date.AddDays(-1), // past
                },
                new OrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Item2",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Status = OrderProductStatus.Delayed,
                    EndDate = DateTime.UtcNow.Date.AddDays(-5),
                },
                new OrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    Description = "Item3",
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    Status = OrderProductStatus.Returned,
                    EndDate = DateTime.UtcNow.Date.AddDays(-2),
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
                        op => op.Product
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
                        It.IsAny<Expression<Func<OrderProduct, object>>>(),
                        It.IsAny<Expression<Func<OrderProduct, object>>>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task OrderProductService_FindByProductId_ShouldReturnItems_WhenProductIdIsValid()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.ProductId == productId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Order.BusinessPartner,
                        op => op.Product
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
            var result = await _orderProductService.FindByProductId(productId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                op =>
                    op.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Order.BusinessPartner,
                        op => op.Product
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

        [Fact]
        public async Task OrderProductService_FindDelayed_ShouldReturnDelayedAndPastItems()
        {
            // Arrange
            var today = DateTime.UtcNow.Date;
            var tomorrowUtc = today.AddDays(1);
            var expectedItems = _itemsMock
                .Where(i =>
                    i.Status == OrderProductStatus.Delayed
                    || (
                        i.Status != OrderProductStatus.Returned
                        && i.EndDate != default(DateTime)
                        // include past and today: EndDate < tomorrowUtc
                        && i.EndDate < tomorrowUtc
                    )
                )
                .ToList();

            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Order.BusinessPartner,
                        op => op.Product
                    )
                )
                .ReturnsAsync(expectedItems);

            // Act
            var result = await _orderProductService.FindDelayed();

            // Assert basic success
            Assert.Equal(ResponseStatus.Success, result.Status);
            // Ensure returned count matches expected
            var data = result.Data?.ToList() ?? new List<OrderProductDto>();
            Assert.Equal(expectedItems.Count, data.Count);

            // Ensure returned items IDs match expected IDs
            var expectedIds = expectedItems.Select(e => e.Id).OrderBy(id => id).ToList();
            var resultIds = data.Select(d => d.Id).OrderBy(id => id).ToList();
            Assert.Equal(expectedIds, resultIds);

            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<OrderProduct, bool>>>(),
                        op => op.Order,
                        op => op.Order.BusinessPartner,
                        op => op.Product
                    ),
                Times.Once
            );
        }
    }
}
