using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Services.Tests.Services
{
    public class PassengerServiceTests
    {
        private readonly PassengerService _service;
        private readonly Mock<IRepository<Passenger>> _repository;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly Guid _tripId = Guid.Parse("00000000-0000-0000-0000-000000000010");

        public PassengerServiceTests()
        {
            _repository = new Mock<IRepository<Passenger>>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _featureToggleServiceMock
                            .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
                            .ReturnsAsync(true);
            _logServiceMock = new Mock<ILogService>();
            _service = new PassengerService(
                _repository.Object,
                _featureToggleServiceMock.Object,
                _logServiceMock.Object
            );
        }

        [Fact]
        public async Task PassengerService_Add_ShouldAddPassengerSuccessfully()
        {
            // Arrange
            var passenger = new Passenger
            {
                Id = Guid.NewGuid(),
                TripId = _tripId,
                Name = "Maria Silva",
            };

            // Act
            var result = await _service.Add(passenger);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(passenger, result.Data);
            _repository.Verify(_ => _.AddAsync(passenger), Times.Once);
        }

        [Fact]
        public async Task PassengerService_AddRange_ShouldAddAllPassengers()
        {
            // Arrange
            var passengers = new List<Passenger>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    TripId = _tripId,
                    Name = "Passageiro 1",
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    TripId = _tripId,
                    Name = "Passageiro 2",
                },
            };

            // Act
            var result = await _service.AddRange(passengers);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(2, result.Data!.Count());
            Assert.Equal("2 passageiro(s) importado(s) com sucesso.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Passenger>()), Times.Exactly(2));
        }

        [Fact]
        public async Task PassengerService_AddRange_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var passengers = new List<Passenger>
            {
                new() { Id = Guid.NewGuid(), TripId = _tripId, Name = "Passageiro 1" },
            };
            _repository
                .Setup(_ => _.AddAsync(It.IsAny<Passenger>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.AddRange(passengers);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task PassengerService_Update_ShouldUpdatePassengerSuccessfully()
        {
            // Arrange
            var passenger = new Passenger
            {
                Id = Guid.NewGuid(),
                TripId = _tripId,
                Name = "Maria Silva",
            };

            // Act
            var result = await _service.Update(passenger);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(passenger), Times.Once);
        }

        [Fact]
        public async Task PassengerService_Remove_ShouldRemovePassengerSuccessfully()
        {
            // Arrange
            var passenger = new Passenger
            {
                Id = Guid.NewGuid(),
                TripId = _tripId,
                Name = "Maria Silva",
            };

            // Act
            var result = await _service.Remove(passenger);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(passenger), Times.Once);
        }

        [Fact]
        public async Task PassengerService_FindByTrip_ShouldReturnPassengersForTrip()
        {
            // Arrange
            var passengers = new List<Passenger>
            {
                new() { Id = Guid.NewGuid(), TripId = _tripId, Name = "Maria Silva" },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Passenger, bool>>>()))
                .ReturnsAsync(passengers);

            // Act
            var result = await _service.FindByTrip(_tripId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(passengers, result.Data);
        }
    }
}
