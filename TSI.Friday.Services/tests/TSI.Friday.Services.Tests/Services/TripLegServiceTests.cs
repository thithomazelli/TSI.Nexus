using System.Linq.Expressions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class TripLegServiceTests
    {
        private readonly TripLegService _service;
        private readonly Mock<IRepository<TripLeg>> _repository;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly Guid _orderId = Guid.Parse("00000000-0000-0000-0000-000000000010");

        public TripLegServiceTests()
        {
            _repository = new Mock<IRepository<TripLeg>>();
            _logServiceMock = new Mock<ILogService>();
            _service = new TripLegService(_repository.Object, _logServiceMock.Object);
        }

        [Fact]
        public async Task TripLegService_Add_ShouldAddTripLegSuccessfully()
        {
            // Arrange
            var tripLeg = new TripLeg
            {
                Id = Guid.NewGuid(),
                OrderId = _orderId,
                SequenceNumber = 1,
                Origin = "São Paulo",
                Destination = "Campinas",
            };

            // Act
            var result = await _service.Add(tripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(tripLeg, result.Data);
            _repository.Verify(_ => _.AddAsync(tripLeg), Times.Once);
        }

        [Fact]
        public async Task TripLegService_Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var exception = new Exception("boom");
            var tripLeg = new TripLeg { Id = Guid.NewGuid(), OrderId = _orderId };
            _repository.Setup(_ => _.AddAsync(tripLeg)).ThrowsAsync(exception);

            // Act
            var result = await _service.Add(tripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task TripLegService_Update_ShouldUpdateTripLegSuccessfully()
        {
            // Arrange
            var tripLeg = new TripLeg { Id = Guid.NewGuid(), OrderId = _orderId };

            // Act
            var result = await _service.Update(tripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(tripLeg), Times.Once);
        }

        [Fact]
        public async Task TripLegService_Remove_ShouldRemoveTripLegSuccessfully()
        {
            // Arrange
            var tripLeg = new TripLeg { Id = Guid.NewGuid(), OrderId = _orderId };

            // Act
            var result = await _service.Remove(tripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(tripLeg), Times.Once);
        }

        [Fact]
        public async Task TripLegService_FindById_ShouldReturnTripLeg_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var tripLeg = new TripLeg { Id = id, OrderId = _orderId };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(tripLeg);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(tripLeg, result.Data);
        }

        [Fact]
        public async Task TripLegService_FindByOrder_ShouldReturnLegsOrderedBySequenceNumber()
        {
            // Arrange
            var legs = new List<TripLeg>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    OrderId = _orderId,
                    SequenceNumber = 2,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    OrderId = _orderId,
                    SequenceNumber = 1,
                },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<TripLeg, bool>>>()))
                .ReturnsAsync(legs);

            // Act
            var result = await _service.FindByOrder(_orderId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(1, result.Data!.First().SequenceNumber);
            Assert.Equal(2, result.Data!.Last().SequenceNumber);
        }
    }
}
