using System.Linq.Expressions;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;

namespace TSI.Nexus.Services.Tests.Services
{
    public class TripDriverServiceTests
    {
        private readonly Mock<IRepository<TripDriver>> _repository;
        private readonly Mock<IRepository<Trip>> _tripRepository;
        private readonly Mock<IRepository<Payment>> _paymentRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;
        private readonly TripDriverService _service;

        public TripDriverServiceTests()
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
            _repository = new Mock<IRepository<TripDriver>>();
            _tripRepository = new Mock<IRepository<Trip>>();
            _paymentRepository = new Mock<IRepository<Payment>>();
            _logService = new Mock<ILogService>();
            _service = new TripDriverService(
                _repository.Object,
                _tripRepository.Object,
                _paymentRepository.Object,
                _mapper,
                _logService.Object
            );
        }

        private static TripDriverDto BuildDto(Guid tripId, Guid driverId) =>
            new()
            {
                TripId = tripId,
                DriverId = driverId,
                Amount = 100,
                DriverName = "João",
            };

        [Fact]
        public async Task Add_ShouldLinkDriverAndCreatePayment_WhenTripExistsAndNotAlreadyLinked()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var trip = new Trip
            {
                Id = tripId,
                TripNumber = "TRP-0001",
                Date = DateTime.Today,
                TransactionId = Guid.NewGuid(),
            };
            var dto = BuildDto(tripId, driverId);

            _tripRepository.Setup(_ => _.GetByIdAsync(tripId)).ReturnsAsync(trip);
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<TripDriver, bool>>>()))
                .ReturnsAsync(false);
            _repository.Setup(_ => _.AddAsync(It.IsAny<TripDriver>())).Returns(Task.CompletedTask);
            _paymentRepository
                .Setup(_ => _.AddAsync(It.IsAny<Payment>()))
                .Returns(Task.CompletedTask);
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<TripDriver>())).Returns(Task.CompletedTask);

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"Motorista João associado à Viagem TRP-0001 com sucesso.", result.Message);
            Assert.NotEqual(Guid.Empty, result.Data!.PaymentId);
            _repository.Verify(_ => _.AddAsync(It.IsAny<TripDriver>()), Times.Once);
            _paymentRepository.Verify(
                _ =>
                    _.AddAsync(
                        It.Is<Payment>(p =>
                            p.Type == PaymentType.Outgoing
                            && p.Category == "Motorista"
                            && p.TripId == tripId
                            && p.DriverId == driverId
                            && p.Price == 100
                        )
                    ),
                Times.Once
            );
            _repository.Verify(_ => _.UpdateAsync(It.Is<TripDriver>(td => td.PaymentId != null)), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnError_WhenTripIsNotFound()
        {
            // Arrange
            var dto = BuildDto(Guid.NewGuid(), Guid.NewGuid());
            _tripRepository.Setup(_ => _.GetByIdAsync(dto.TripId)).ReturnsAsync((Trip)null!);

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal("Viagem não encontrada para associar o motorista.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<TripDriver>()), Times.Never);
        }

        [Fact]
        public async Task Add_ShouldReturnError_WhenDriverIsAlreadyLinkedToTrip()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var dto = BuildDto(tripId, Guid.NewGuid());
            var trip = new Trip { Id = tripId, TripNumber = "TRP-0001" };
            _tripRepository.Setup(_ => _.GetByIdAsync(tripId)).ReturnsAsync(trip);
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<TripDriver, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal("Este motorista já está associado a esta viagem.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<TripDriver>()), Times.Never);
        }

        [Fact]
        public async Task Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var dto = BuildDto(Guid.NewGuid(), Guid.NewGuid());
            _tripRepository.Setup(_ => _.GetByIdAsync(dto.TripId)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.Add", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task Update_ShouldUpdateAmountAndPayment_WhenTripDriverAndPaymentExist()
        {
            // Arrange
            var id = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var existing = new TripDriver { Id = id, Amount = 50, PaymentId = paymentId };
            var payment = new Payment { Id = paymentId, Price = 50 };
            var dto = new TripDriverDto { Id = id, Amount = 150 };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);
            _paymentRepository.Setup(_ => _.GetByIdAsync(paymentId)).ReturnsAsync(payment);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(150, existing.Amount);
            Assert.Equal(150, payment.Price);
            _repository.Verify(_ => _.UpdateAsync(existing), Times.Once);
            _paymentRepository.Verify(_ => _.UpdateAsync(payment), Times.Once);
        }

        [Fact]
        public async Task Update_ShouldSkipPaymentUpdate_WhenTripDriverHasNoPaymentId()
        {
            // Arrange
            var id = Guid.NewGuid();
            var existing = new TripDriver { Id = id, Amount = 50, PaymentId = null };
            var dto = new TripDriverDto { Id = id, Amount = 150 };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _paymentRepository.Verify(_ => _.GetByIdAsync(It.IsAny<Guid?>()), Times.Never);
            _paymentRepository.Verify(_ => _.UpdateAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task Update_ShouldSkipPaymentUpdate_WhenPaymentIsNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var existing = new TripDriver { Id = id, Amount = 50, PaymentId = paymentId };
            var dto = new TripDriverDto { Id = id, Amount = 150 };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);
            _paymentRepository.Setup(_ => _.GetByIdAsync(paymentId)).ReturnsAsync((Payment)null!);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _paymentRepository.Verify(_ => _.UpdateAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task Update_ShouldReturnError_WhenTripDriverIsNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new TripDriverDto { Id = id, Amount = 150 };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync((TripDriver)null!);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal("Registro de motorista da viagem não encontrado.", result.Message);
        }

        [Fact]
        public async Task Update_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new TripDriverDto { Id = id, Amount = 150 };
            _repository.Setup(_ => _.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.Update", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task Remove_ShouldRemoveTripDriverAndPayment_WhenBothExist()
        {
            // Arrange
            var id = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var existing = new TripDriver { Id = id, PaymentId = paymentId };
            var payment = new Payment { Id = paymentId };
            var dto = new TripDriverDto { Id = id };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);
            _paymentRepository.Setup(_ => _.GetByIdAsync(paymentId)).ReturnsAsync(payment);

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(existing), Times.Once);
            _paymentRepository.Verify(_ => _.RemoveAsync(payment), Times.Once);
        }

        [Fact]
        public async Task Remove_ShouldSkipPaymentRemoval_WhenTripDriverHasNoPaymentId()
        {
            // Arrange
            var id = Guid.NewGuid();
            var existing = new TripDriver { Id = id, PaymentId = null };
            var dto = new TripDriverDto { Id = id };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _paymentRepository.Verify(_ => _.RemoveAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task Remove_ShouldSkipPaymentRemoval_WhenPaymentIsNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var paymentId = Guid.NewGuid();
            var existing = new TripDriver { Id = id, PaymentId = paymentId };
            var dto = new TripDriverDto { Id = id };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);
            _paymentRepository.Setup(_ => _.GetByIdAsync(paymentId)).ReturnsAsync((Payment)null!);

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _paymentRepository.Verify(_ => _.RemoveAsync(It.IsAny<Payment>()), Times.Never);
        }

        [Fact]
        public async Task Remove_ShouldReturnError_WhenTripDriverIsNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new TripDriverDto { Id = id };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync((TripDriver)null!);

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal("Registro de motorista da viagem não encontrado.", result.Message);
        }

        [Fact]
        public async Task Remove_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new TripDriverDto { Id = id };
            _repository.Setup(_ => _.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.Remove", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task FindByTripId_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            var items = new List<TripDriver> { new() { Id = Guid.NewGuid(), TripId = tripId } };
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<TripDriver, bool>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindByTripId(tripId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindByTripId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var tripId = Guid.NewGuid();
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<TripDriver, bool>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByTripId(tripId);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.FindByTripId", tripId),
                Times.Once
            );
        }

        [Fact]
        public async Task FindByDriverId_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var items = new List<TripDriver> { new() { Id = Guid.NewGuid(), DriverId = driverId } };
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<TripDriver, bool>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindByDriverId(driverId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindByDriverId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<TripDriver, bool>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByDriverId(driverId);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.FindByDriverId", driverId),
                Times.Once
            );
        }

        [Fact]
        public async Task FindById_ShouldReturnMappedItem_WhenFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var item = new TripDriver { Id = id };
            _repository
                .Setup(_ => _.GetByIdAsync(
                    id,
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ReturnsAsync(item);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Motorista da viagem encontrado com sucesso", result.Message);
            Assert.NotNull(result.Data);
        }

        [Fact]
        public async Task FindById_ShouldReturnNoData_WhenNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository
                .Setup(_ => _.GetByIdAsync(
                    id,
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ReturnsAsync((TripDriver)null!);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhum registro de motorista da viagem com o ID {id} foi encontrado", result.Message);
        }

        [Fact]
        public async Task FindById_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository
                .Setup(_ => _.GetByIdAsync(
                    id,
                    It.IsAny<Expression<Func<TripDriver, object>>>(),
                    It.IsAny<Expression<Func<TripDriver, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "TripDriverService.FindById", id),
                Times.Once
            );
        }
    }
}
