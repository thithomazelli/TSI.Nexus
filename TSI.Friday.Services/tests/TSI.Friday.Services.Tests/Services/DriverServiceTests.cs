using System.Linq.Expressions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class DriverServiceTests
    {
        private readonly DriverService _driverService;
        private readonly Mock<IRepository<Driver>> _repository;
        private readonly Mock<IRepository<Order>> _orderRepositoryMock;
        private readonly Mock<ILogService> _logServiceMock;
        private readonly IList<Driver> _driverListMock;

        public DriverServiceTests()
        {
            _repository = new Mock<IRepository<Driver>>();
            _orderRepositoryMock = new Mock<IRepository<Order>>();
            _logServiceMock = new Mock<ILogService>();
            _driverService = new DriverService(
                _repository.Object,
                _orderRepositoryMock.Object,
                _logServiceMock.Object
            );

            _driverListMock = new List<Driver>
            {
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Name = "João da Silva",
                    SocialSecurityCard = "11111111111",
                    LicenseNumber = "12345678900",
                    LicenseCategory = "D",
                    EmploymentType = EmploymentType.CLT,
                    Status = DriverStatus.Active,
                },
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Name = "Maria Souza",
                    SocialSecurityCard = "22222222222",
                    LicenseNumber = "98765432100",
                    LicenseCategory = "E",
                    EmploymentType = EmploymentType.CLT,
                    Status = DriverStatus.Inactive,
                },
            };
        }

        [Fact]
        public async Task DriverService_Add_ShouldAddDriverSuccessfully_WhenSocialSecurityCardIsNotDuplicated()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
                SocialSecurityCard = "11111111111",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _driverService.Add(driverMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(driverMock, result.Data);
            Assert.Equal($"Motorista {driverMock.Name} cadastrado com sucesso.", result.Message);
            _repository.Verify(_ => _.AddAsync(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriverService_Add_ShouldNotAddDriverAndReturnAnErrorMessage_WhenSocialSecurityCardIsDuplicated()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
                SocialSecurityCard = "11111111111",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _driverService.Add(driverMock);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            Assert.Equal(
                $"Já existe um Motorista cadastrado com o CPF {driverMock.SocialSecurityCard}.",
                result.Message
            );
            _repository.Verify(_ => _.AddAsync(It.IsAny<Driver>()), Times.Never);
        }

        [Fact]
        public async Task DriverService_Update_ShouldUpdateDriverSuccessfully_WhenSocialSecurityCardIsNotDuplicated()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
                SocialSecurityCard = "11111111111",
            };

            _repository
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _driverService.Update(driverMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriverService_Remove_ShouldReturnWarning_WhenDriverIsLinkedToOrders()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
            };

            _orderRepositoryMock
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _driverService.Remove(driverMock);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Driver>()), Times.Never);
        }

        [Fact]
        public async Task DriverService_Remove_ShouldRemoveDriverSuccessfully_WhenNotLinkedToOrders()
        {
            // Arrange
            var driverMock = new Driver
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Name = "João da Silva",
            };

            _orderRepositoryMock
                .Setup(_ => _.AnyAsync(It.IsAny<Expression<Func<Order, bool>>>()))
                .ReturnsAsync(false);

            // Act
            var result = await _driverService.Remove(driverMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(It.IsAny<Driver>()), Times.Once);
        }

        [Fact]
        public async Task DriverService_FindAll_ShouldReturnAllDrivers()
        {
            // Arrange
            _repository.Setup(_ => _.GetAllAsync()).ReturnsAsync(_driverListMock);

            // Act
            var result = await _driverService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(_driverListMock, result.Data);
        }

        [Fact]
        public async Task DriverService_FindById_ShouldReturnDriver_WhenIdIsValid()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverMock = _driverListMock.First(_ => idMock.Equals(_.Id));

            _repository.Setup(_ => _.GetByIdAsync(idMock)).ReturnsAsync(driverMock);

            // Act
            var result = await _driverService.FindById(idMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(driverMock, result.Data);
        }

        [Fact]
        public async Task DriverService_FindBySocialSecurityCard_ShouldReturnDriver_WhenCpfIsValid()
        {
            // Arrange
            const string cpfMock = "11111111111";
            var driverMock = _driverListMock.First(_ => cpfMock.Equals(_.SocialSecurityCard));

            _repository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(driverMock);

            // Act
            var result = await _driverService.FindBySocialSecurityCard(cpfMock);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(driverMock, result.Data);
        }

        [Fact]
        public async Task DriverService_FindActive_ShouldReturnOnlyActiveDrivers()
        {
            // Arrange
            var activeOnly = _driverListMock.Where(d => d.Status == DriverStatus.Active).ToList();

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Driver, bool>>>()))
                .ReturnsAsync(activeOnly);

            // Act
            var result = await _driverService.FindActive();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(activeOnly, result.Data);
        }
    }
}
