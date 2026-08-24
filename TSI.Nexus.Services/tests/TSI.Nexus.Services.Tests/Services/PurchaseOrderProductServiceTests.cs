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
using Microsoft.Extensions.Logging;

namespace TSI.Nexus.Services.Tests.Services
{
    public class PurchaseOrderProductServiceTests
    {
        private readonly PurchaseOrderProductService _purchaseOrderProductService;
        private readonly Mock<IRepository<PurchaseOrderProduct>> _repository;
        private readonly Mock<IRepository<PurchaseOrder>> _purchaseOrderRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;
        private readonly IList<PurchaseOrderProduct> _itemsMock;

        public PurchaseOrderProductServiceTests()
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

            _repository = new Mock<IRepository<PurchaseOrderProduct>>();
            _purchaseOrderRepository = new Mock<IRepository<PurchaseOrder>>();
            _logService = new Mock<ILogService>();

            _purchaseOrderProductService = new PurchaseOrderProductService(
                _repository.Object,
                _purchaseOrderRepository.Object,
                _mapper,
                _logService.Object
            );

            _itemsMock = new List<PurchaseOrderProduct>
            {
                new PurchaseOrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Item1",
                    PurchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new PurchaseOrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Item2",
                    PurchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
                new PurchaseOrderProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    Description = "Item3",
                    PurchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                },
            };
        }

        [Fact]
        public async Task PurchaseOrderProductService_Add_ShouldAddItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = new PurchaseOrderProductDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Item3",
                PurchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<PurchaseOrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido de Compra {itemDto.Description} cadastrado com sucesso.",
            };

            // Act
            var result = await _purchaseOrderProductService.Add(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<PurchaseOrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductService_Update_ShouldUpdateItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<PurchaseOrderProductDto>(_itemsMock.First());
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<PurchaseOrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido de Compra {itemDto.Description} atualizado com sucesso.",
            };

            // Act
            var result = await _purchaseOrderProductService.Update(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<PurchaseOrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductService_Remove_ShouldRemoveItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<PurchaseOrderProductDto>(_itemsMock.First());
            _repository
                .Setup(_ => _.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new PurchaseOrderProduct());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<PurchaseOrderProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido de Compra {itemDto.Description} removido com sucesso.",
            };

            // Act
            var result = await _purchaseOrderProductService.Remove(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<PurchaseOrderProduct>()), Times.Once);
        }

        [Fact]
        public async Task PurchaseOrderProductService_FindByPurchaseOrderId_ShouldReturnItems_WhenPurchaseOrderIdIsValid()
        {
            // Arrange
            var purchaseOrderId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.PurchaseOrderId == purchaseOrderId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<PurchaseOrderProduct, bool>>>(),
                        op => op.PurchaseOrder,
                        op => op.Product
                    )
                )
                .ReturnsAsync(items);

            var expected = new WebApiResponse<IEnumerable<PurchaseOrderProductDto>>
            {
                Data = _mapper.Map<IEnumerable<PurchaseOrderProductDto>>(items),
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _purchaseOrderProductService.FindByPurchaseOrderId(purchaseOrderId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<PurchaseOrderProduct, bool>>>(),
                        It.IsAny<Expression<Func<PurchaseOrderProduct, object>>>(),
                        It.IsAny<Expression<Func<PurchaseOrderProduct, object>>>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PurchaseOrderProductService_FindByProductId_ShouldReturnItems_WhenProductIdIsValid()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.ProductId == productId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<PurchaseOrderProduct, bool>>>(),
                        op => op.PurchaseOrder,
                        op => op.PurchaseOrder.BusinessPartner,
                        op => op.Product
                    )
                )
                .ReturnsAsync(items);

            var expected = new WebApiResponse<IEnumerable<PurchaseOrderProductDto>>
            {
                Data = _mapper.Map<IEnumerable<PurchaseOrderProductDto>>(items),
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _purchaseOrderProductService.FindByProductId(productId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                op =>
                    op.QueryAsync(
                        It.IsAny<Expression<Func<PurchaseOrderProduct, bool>>>(),
                        op => op.PurchaseOrder,
                        op => op.PurchaseOrder.BusinessPartner,
                        op => op.Product
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task PurchaseOrderProductService_FindById_ShouldReturnItem_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var item = _itemsMock.First(i => i.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

            var expected = new WebApiResponse<PurchaseOrderProductDto>
            {
                Data = _mapper.Map<PurchaseOrderProductDto>(item),
                Status = ResponseStatus.Success,
                Message = $"Item do Pedido de Compra {item.Description} encontrado com sucesso",
            };

            // Act
            var result = await _purchaseOrderProductService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }
    }
}
