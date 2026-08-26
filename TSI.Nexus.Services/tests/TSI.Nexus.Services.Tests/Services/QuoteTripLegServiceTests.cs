using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Services.Tests.Services
{
    public class QuoteTripLegServiceTests
    {
        private readonly QuoteTripLegService _service;
        private readonly Mock<IRepository<QuoteTripLeg>> _repository;
        private readonly Mock<IFeatureToggleService> _featureToggleServiceMock;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly Guid _quoteTripId = Guid.Parse("00000000-0000-0000-0000-000000000010");

        public QuoteTripLegServiceTests()
        {
            _repository = new Mock<IRepository<QuoteTripLeg>>();
            _featureToggleServiceMock = new Mock<IFeatureToggleService>();
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _featureToggleServiceMock
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
                .ReturnsAsync(true);
            _logServiceMock = new Mock<ILogService>();
            _service = new QuoteTripLegService(
                _repository.Object,
                _featureToggleServiceMock.Object,
                _logServiceMock.Object
            );
        }

        [Fact]
        public async Task QuoteTripLegService_Add_ShouldAddQuoteTripLegSuccessfully()
        {
            // Arrange
            var quoteTripLeg = new QuoteTripLeg
            {
                Id = Guid.NewGuid(),
                QuoteTripId = _quoteTripId,
                SequenceNumber = 1,
                Origin = "São Paulo",
                Destination = "Campinas",
            };

            // Act
            var result = await _service.Add(quoteTripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(quoteTripLeg, result.Data);
            _repository.Verify(_ => _.AddAsync(quoteTripLeg), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegService_Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var exception = new Exception("boom");
            var quoteTripLeg = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = _quoteTripId };
            _repository.Setup(_ => _.AddAsync(quoteTripLeg)).ThrowsAsync(exception);

            // Act
            var result = await _service.Add(quoteTripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task QuoteTripLegService_Update_ShouldUpdateQuoteTripLegSuccessfully()
        {
            // Arrange
            var quoteTripLeg = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = _quoteTripId };

            // Act
            var result = await _service.Update(quoteTripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(quoteTripLeg), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegService_Remove_ShouldRemoveQuoteTripLegSuccessfully()
        {
            // Arrange
            var quoteTripLeg = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = _quoteTripId };

            // Act
            var result = await _service.Remove(quoteTripLeg);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(quoteTripLeg), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegService_FindById_ShouldReturnQuoteTripLeg_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var quoteTripLeg = new QuoteTripLeg { Id = id, QuoteTripId = _quoteTripId };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(quoteTripLeg);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(quoteTripLeg, result.Data);
        }

        [Fact]
        public async Task QuoteTripLegService_FindByQuoteTrip_ShouldReturnLegsOrderedBySequenceNumber()
        {
            // Arrange
            var legs = new List<QuoteTripLeg>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    QuoteTripId = _quoteTripId,
                    SequenceNumber = 2,
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    QuoteTripId = _quoteTripId,
                    SequenceNumber = 1,
                },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<QuoteTripLeg, bool>>>()))
                .ReturnsAsync(legs);

            // Act
            var result = await _service.FindByQuoteTrip(_quoteTripId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(1, result.Data!.First().SequenceNumber);
            Assert.Equal(2, result.Data!.Last().SequenceNumber);
        }
    }
}
