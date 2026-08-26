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
    public class VehicleMaintenanceProductServiceTests
    {
        private readonly VehicleMaintenanceProductService _vehicleMaintenanceProductService;
        private readonly Mock<IRepository<VehicleMaintenanceProduct>> _repository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;
        private readonly IList<VehicleMaintenanceProduct> _itemsMock;

        public VehicleMaintenanceProductServiceTests()
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

            _repository = new Mock<IRepository<VehicleMaintenanceProduct>>();
            _logService = new Mock<ILogService>();

            _vehicleMaintenanceProductService = new VehicleMaintenanceProductService(
                _repository.Object,
                _mapper,
                _logService.Object
            );

            _itemsMock = new List<VehicleMaintenanceProduct>
            {
                new VehicleMaintenanceProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Item1",
                    VehicleMaintenanceId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new VehicleMaintenanceProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Item2",
                    VehicleMaintenanceId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                },
                new VehicleMaintenanceProduct
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                    Description = "Item3",
                    VehicleMaintenanceId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                },
            };
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Add_ShouldAddItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = new VehicleMaintenanceProductDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Item3",
                VehicleMaintenanceId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                ProductId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<VehicleMaintenanceProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Peça {itemDto.Description} cadastrada na Manutenção com sucesso.",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.Add(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<VehicleMaintenanceProduct>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Update_ShouldUpdateItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<VehicleMaintenanceProductDto>(_itemsMock.First());
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<VehicleMaintenanceProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Peça {itemDto.Description} atualizada com sucesso.",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.Update(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<VehicleMaintenanceProduct>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Remove_ShouldRemoveItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var itemDto = _mapper.Map<VehicleMaintenanceProductDto>(_itemsMock.First());
            _repository
                .Setup(_ => _.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new VehicleMaintenanceProduct());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<VehicleMaintenanceProduct>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = itemDto,
                Status = ResponseStatus.Success,
                Message = $"Peça {itemDto.Description} removida com sucesso.",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.Remove(itemDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<VehicleMaintenanceProduct>()), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindByVehicleMaintenanceId_ShouldReturnItems_WhenVehicleMaintenanceIdIsValid()
        {
            // Arrange
            var vehicleMaintenanceId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock
                .Where(i => i.VehicleMaintenanceId == vehicleMaintenanceId)
                .ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        vmp => vmp.VehicleMaintenance,
                        vmp => vmp.Product
                    )
                )
                .ReturnsAsync(items);

            var expected = new WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            {
                Data = _mapper.Map<IEnumerable<VehicleMaintenanceProductDto>>(items),
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.FindByVehicleMaintenanceId(
                vehicleMaintenanceId
            );

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>()
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindByProductId_ShouldReturnItems_WhenProductIdIsValid()
        {
            // Arrange
            var productId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var items = _itemsMock.Where(i => i.ProductId == productId).ToList();
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        vmp => vmp.VehicleMaintenance,
                        vmp => vmp.VehicleMaintenance.Vehicle,
                        vmp => vmp.Product
                    )
                )
                .ReturnsAsync(items);

            var expected = new WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>
            {
                Data = _mapper.Map<IEnumerable<VehicleMaintenanceProductDto>>(items),
                Status = ResponseStatus.Success,
                Message = $"{items.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.FindByProductId(productId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        vmp => vmp.VehicleMaintenance,
                        vmp => vmp.VehicleMaintenance.Vehicle,
                        vmp => vmp.Product
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindById_ShouldReturnItem_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var item = _itemsMock.First(i => i.Id == id);
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync(item);

            var expected = new WebApiResponse<VehicleMaintenanceProductDto>
            {
                Data = _mapper.Map<VehicleMaintenanceProductDto>(item),
                Status = ResponseStatus.Success,
                Message = $"Peça {item.Description} encontrada com sucesso",
            };

            // Act
            var result = await _vehicleMaintenanceProductService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id), Times.Once);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000099");
            _repository.Setup(r => r.GetByIdAsync(id)).ReturnsAsync((VehicleMaintenanceProduct)null);

            // Act
            var result = await _vehicleMaintenanceProductService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhuma Peça com o ID {id} foi encontrada", result.Message);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindById_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _repository.Setup(r => r.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var itemDto = new VehicleMaintenanceProductDto { Description = "Item" };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<VehicleMaintenanceProduct>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.Add(itemDto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Update_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var itemDto = new VehicleMaintenanceProductDto { Description = "Item" };
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<VehicleMaintenanceProduct>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.Update(itemDto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_Remove_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var itemDto = new VehicleMaintenanceProductDto { Description = "Item" };
            _repository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.Remove(itemDto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindAll_ShouldReturnItems_WhenDataExists()
        {
            // Arrange
            _repository
                .Setup(r =>
                    r.GetAllAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>()
                    )
                )
                .ReturnsAsync(_itemsMock);

            // Act
            var result = await _vehicleMaintenanceProductService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(_itemsMock.Count, result.Data.Count());
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindAll_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(r =>
                    r.GetAllAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>()
                    )
                )
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindByVehicleMaintenanceId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>()
                    )
                )
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.FindByVehicleMaintenanceId(
                Guid.NewGuid()
            );

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task VehicleMaintenanceProductService_FindByProductId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, bool>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>(),
                        It.IsAny<Expression<Func<VehicleMaintenanceProduct, object>>>()
                    )
                )
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _vehicleMaintenanceProductService.FindByProductId(Guid.NewGuid());

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }
    }
}
