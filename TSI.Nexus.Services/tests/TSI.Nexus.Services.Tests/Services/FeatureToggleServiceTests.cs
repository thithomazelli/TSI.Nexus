using System.Linq.Expressions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services.Tests.Services
{
    public class FeatureToggleServiceTests
    {
        private readonly Mock<IRepository<FeatureToggle>> _repository;
        private readonly Mock<ILogService> _logService;
        private readonly FeatureToggleService _service;

        public FeatureToggleServiceTests()
        {
            _repository = new Mock<IRepository<FeatureToggle>>();
            _logService = new Mock<ILogService>();
            _service = new FeatureToggleService(_repository.Object, _logService.Object);
        }

        [Fact]
        public async Task FindAll_ShouldReturnAllFeatureToggles_WhenRepositorySucceeds()
        {
            // Arrange
            var toggles = new List<FeatureToggle> { new() { Key = "A" }, new() { Key = "B" } };
            _repository.Setup(_ => _.GetAllAsync()).ReturnsAsync(toggles);

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(2, result.Data!.Count());
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
                _ => _.LogException(It.IsAny<Exception>(), "FeatureToggleService.FindAll", null),
                Times.Once
            );
        }

        [Fact]
        public async Task FindByKey_ShouldReturnFeatureToggle_WhenKeyIsFound()
        {
            // Arrange
            var toggle = new FeatureToggle { Key = "A", Name = "Módulo A" };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync(toggle);

            // Act
            var result = await _service.FindByKey("A");

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Feature Toggle Módulo A encontrado com sucesso", result.Message);
        }

        [Fact]
        public async Task FindByKey_ShouldReturnSuccessWithNoData_WhenKeyIsNotFound()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync((FeatureToggle)null!);

            // Act
            var result = await _service.FindByKey("Missing");

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal("Nenhum Feature Toggle com a chave Missing foi encontrado", result.Message);
        }

        [Fact]
        public async Task FindByKey_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByKey("A");

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "FeatureToggleService.FindByKey", "A"),
                Times.Once
            );
        }

        [Fact]
        public async Task SetEnabled_ShouldEnableFeatureToggle_WhenKeyIsFound()
        {
            // Arrange
            var toggle = new FeatureToggle { Key = "A", Name = "Módulo A", Enabled = false };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync(toggle);

            // Act
            var result = await _service.SetEnabled("A", true);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.True(toggle.Enabled);
            Assert.Equal("Módulo Módulo A ativado com sucesso.", result.Message);
            _repository.Verify(_ => _.UpdateAsync(toggle), Times.Once);
        }

        [Fact]
        public async Task SetEnabled_ShouldDisableFeatureToggle_WhenKeyIsFound()
        {
            // Arrange
            var toggle = new FeatureToggle { Key = "A", Name = "Módulo A", Enabled = true };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync(toggle);

            // Act
            var result = await _service.SetEnabled("A", false);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.False(toggle.Enabled);
            Assert.Equal("Módulo Módulo A desativado com sucesso.", result.Message);
        }

        [Fact]
        public async Task SetEnabled_ShouldReturnWarning_WhenKeyIsNotFound()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync((FeatureToggle)null!);

            // Act
            var result = await _service.SetEnabled("Missing", true);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<FeatureToggle>()), Times.Never);
        }

        [Fact]
        public async Task SetEnabled_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.SetEnabled("A", true);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "FeatureToggleService.SetEnabled", "A"),
                Times.Once
            );
        }

        [Fact]
        public async Task IsEnabledAsync_ShouldReturnEnabledValue_WhenFeatureToggleIsFound()
        {
            // Arrange
            var toggle = new FeatureToggle { Key = "A", Enabled = false };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync(toggle);

            // Act
            var result = await _service.IsEnabledAsync("A");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IsEnabledAsync_ShouldReturnTrue_WhenFeatureToggleIsNotFound()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ReturnsAsync((FeatureToggle)null!);

            // Act
            var result = await _service.IsEnabledAsync("Missing");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsEnabledAsync_ShouldReturnTrue_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.IsEnabledAsync("A");

            // Assert
            Assert.True(result);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "FeatureToggleService.IsEnabledAsync", "A"),
                Times.Once
            );
        }

        [Fact]
        public async Task IsEnabledAsyncTwoArgs_ShouldReturnFalse_WhenEntityToggleIsDisabled()
        {
            // Arrange
            var entityToggle = new FeatureToggle { Key = "Entity", Enabled = false };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(
                    It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Entity"))))
                .ReturnsAsync(entityToggle);

            // Act
            var result = await _service.IsEnabledAsync("Entity", "Group");

            // Assert
            Assert.False(result);
            _repository.Verify(
                _ => _.FirstOrDefaultAsync(It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Group"))),
                Times.Never
            );
        }

        [Fact]
        public async Task IsEnabledAsyncTwoArgs_ShouldReturnGroupValue_WhenEntityToggleIsEnabled()
        {
            // Arrange
            var entityToggle = new FeatureToggle { Key = "Entity", Enabled = true };
            var groupToggle = new FeatureToggle { Key = "Group", Enabled = false };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(
                    It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Entity"))))
                .ReturnsAsync(entityToggle);
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(
                    It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Group"))))
                .ReturnsAsync(groupToggle);

            // Act
            var result = await _service.IsEnabledAsync("Entity", "Group");

            // Assert
            Assert.False(result);
        }

        [Fact]
        public async Task IsEnabledAsyncTwoArgs_ShouldReturnTrue_WhenBothTogglesAreEnabled()
        {
            // Arrange
            var entityToggle = new FeatureToggle { Key = "Entity", Enabled = true };
            var groupToggle = new FeatureToggle { Key = "Group", Enabled = true };
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(
                    It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Entity"))))
                .ReturnsAsync(entityToggle);
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(
                    It.Is<Expression<Func<FeatureToggle, bool>>>(e => MatchesKey(e, "Group"))))
                .ReturnsAsync(groupToggle);

            // Act
            var result = await _service.IsEnabledAsync("Entity", "Group");

            // Assert
            Assert.True(result);
        }

        [Fact]
        public async Task IsEnabledAsyncTwoArgs_ShouldReturnTrue_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<FeatureToggle, bool>>>()))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.IsEnabledAsync("Entity", "Group");

            // Assert
            Assert.True(result);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "FeatureToggleService.IsEnabledAsync", "Entity"),
                Times.Once
            );
        }

        private static bool MatchesKey(Expression<Func<FeatureToggle, bool>> expr, string key)
        {
            var compiled = expr.Compile();
            return compiled(new FeatureToggle { Key = key });
        }
    }
}
