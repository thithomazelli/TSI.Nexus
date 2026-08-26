using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services.Tests.Services
{
    public class SequenceServiceTests
    {
        private readonly Mock<IRepository<Sequence>> _repository;
        private readonly SequenceService _service;

        public SequenceServiceTests()
        {
            _repository = new Mock<IRepository<Sequence>>();
            _service = new SequenceService(_repository.Object);
        }

        [Fact]
        public async Task GetNextValue_ShouldCreateSequenceAndReturnOne_WhenSequenceDoesNotExist()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Sequence, bool>>>()))
                .ReturnsAsync(new List<Sequence>());

            // Act
            var result = await _service.GetNextValue("NewSeq");

            // Assert
            Assert.Equal(1L, result);
            _repository.Verify(
                _ => _.AddAsync(It.Is<Sequence>(s => s.Name == "NewSeq" && s.NextVal == 2)),
                Times.Once
            );
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Sequence>()), Times.Never);
        }

        [Fact]
        public async Task GetNextValue_ShouldReturnCurrentAndIncrement_WhenSequenceExistsWithPositiveNextVal()
        {
            // Arrange
            var seq = new Sequence { Name = "OrderNumberSeq", NextVal = 5 };
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Sequence, bool>>>()))
                .ReturnsAsync(new List<Sequence> { seq });

            // Act
            var result = await _service.GetNextValue("OrderNumberSeq");

            // Assert
            Assert.Equal(5L, result);
            Assert.Equal(6, seq.NextVal);
            _repository.Verify(_ => _.UpdateAsync(seq), Times.Once);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Sequence>()), Times.Never);
        }

        [Fact]
        public async Task GetNextValue_ShouldTreatNextValAsOne_WhenExistingNextValIsZeroOrNegative()
        {
            // Arrange
            var seq = new Sequence { Name = "BrokenSeq", NextVal = 0 };
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Sequence, bool>>>()))
                .ReturnsAsync(new List<Sequence> { seq });

            // Act
            var result = await _service.GetNextValue("BrokenSeq");

            // Assert
            Assert.Equal(1L, result);
            Assert.Equal(2, seq.NextVal);
            _repository.Verify(_ => _.UpdateAsync(seq), Times.Once);
        }
    }
}
