using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services.Tests.Services
{
    public class SelectableOptionServiceTests
    {
        private readonly Mock<IRepository<SelectableOption>> _repository;
        private readonly Mock<ILogService> _logService;
        private readonly SelectableOptionService _service;

        public SelectableOptionServiceTests()
        {
            _repository = new Mock<IRepository<SelectableOption>>();
            _logService = new Mock<ILogService>();
            _service = new SelectableOptionService(_repository.Object, _logService.Object);
        }

        [Fact]
        public async Task Add_ShouldAddOption_WhenOptionDoesNotAlreadyExist()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<SelectableOption, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _service.Add(option);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Opção \"Casa\" adicionada com sucesso.", result.Message);
            _repository.Verify(_ => _.AddAsync(option), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnWarning_WhenOptionAlreadyExistsInGroup()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<SelectableOption, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.Add(option);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            Assert.Equal("A opção \"Casa\" já existe nessa lista.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<SelectableOption>()), Times.Never);
        }

        [Fact]
        public async Task Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };
            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<SelectableOption, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Add(option);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "SelectableOptionService.Add", option),
                Times.Once
            );
        }

        [Fact]
        public async Task Update_ShouldUpdateOption_WhenRepositorySucceeds()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };

            // Act
            var result = await _service.Update(option);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Opção \"Casa\" atualizada com sucesso.", result.Message);
            _repository.Verify(_ => _.UpdateAsync(option), Times.Once);
        }

        [Fact]
        public async Task Update_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };
            _repository.Setup(_ => _.UpdateAsync(option)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Update(option);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "SelectableOptionService.Update", option),
                Times.Once
            );
        }

        [Fact]
        public async Task Remove_ShouldRemoveOption_WhenRepositorySucceeds()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };

            // Act
            var result = await _service.Remove(option);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Opção \"Casa\" removida com sucesso.", result.Message);
            _repository.Verify(_ => _.RemoveAsync(option), Times.Once);
        }

        [Fact]
        public async Task Remove_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var option = new SelectableOption { Group = SelectableOptionGroup.AddressType, Value = "Casa" };
            _repository.Setup(_ => _.RemoveAsync(option)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Remove(option);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "SelectableOptionService.Remove", option),
                Times.Once
            );
        }

        [Fact]
        public async Task FindAll_ShouldReturnOptionsOrderedByGroupThenValue_WhenRepositorySucceeds()
        {
            // Arrange
            var options = new List<SelectableOption>
            {
                new() { Group = SelectableOptionGroup.ProductCategory, Value = "B" },
                new() { Group = SelectableOptionGroup.AddressType, Value = "Z" },
                new() { Group = SelectableOptionGroup.AddressType, Value = "A" },
            };
            _repository.Setup(_ => _.GetAllAsync()).ReturnsAsync(options);

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            var ordered = result.Data!.ToList();
            Assert.Equal("A", ordered[0].Value);
            Assert.Equal("Z", ordered[1].Value);
            Assert.Equal("B", ordered[2].Value);
        }

        [Fact]
        public async Task FindAll_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository.Setup(_ => _.GetAllAsync()).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "SelectableOptionService.FindAll", null),
                Times.Once
            );
        }

        [Fact]
        public async Task FindByGroup_ShouldReturnOptionsOrderedByValue_WhenRepositorySucceeds()
        {
            // Arrange
            var options = new List<SelectableOption>
            {
                new() { Group = SelectableOptionGroup.AddressType, Value = "Z" },
                new() { Group = SelectableOptionGroup.AddressType, Value = "A" },
            };
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<SelectableOption, bool>>>()))
                .ReturnsAsync(options);

            // Act
            var result = await _service.FindByGroup(SelectableOptionGroup.AddressType);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            var ordered = result.Data!.ToList();
            Assert.Equal("A", ordered[0].Value);
            Assert.Equal("Z", ordered[1].Value);
        }

        [Fact]
        public async Task FindByGroup_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<SelectableOption, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByGroup(SelectableOptionGroup.AddressType);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ =>
                    _.LogException(
                        It.IsAny<Exception>(),
                        "SelectableOptionService.FindByGroup",
                        SelectableOptionGroup.AddressType
                    ),
                Times.Once
            );
        }
    }
}
