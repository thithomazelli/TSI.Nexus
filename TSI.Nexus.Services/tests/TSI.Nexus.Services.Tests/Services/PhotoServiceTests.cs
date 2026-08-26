using System;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Moq;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Services.Services;
using Xunit;

namespace TSI.Nexus.Services.Tests.Services
{
    public class PhotoServiceTests : IDisposable
    {
        private readonly PhotoService _service;
        private readonly Mock<IRepository<BusinessPartner>> _businessPartnerRepository;
        private readonly Mock<IRepository<Product>> _productRepository;
        private readonly Mock<IRepository<User>> _userRepository;
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<IRepository<Driver>> _driverRepository;
        private readonly string _tempContentRoot;

        public PhotoServiceTests()
        {
            _tempContentRoot = Path.Combine(Path.GetTempPath(), "PhotoServiceTests_" + Guid.NewGuid());
            Directory.CreateDirectory(_tempContentRoot);

            var envMock = new Mock<IWebHostEnvironment>();
            envMock.SetupGet(e => e.ContentRootPath).Returns(_tempContentRoot);

            var configurationMock = new Mock<IConfiguration>();

            _businessPartnerRepository = new Mock<IRepository<BusinessPartner>>();
            _productRepository = new Mock<IRepository<Product>>();
            _userRepository = new Mock<IRepository<User>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _driverRepository = new Mock<IRepository<Driver>>();

            _service = new PhotoService(
                envMock.Object,
                _businessPartnerRepository.Object,
                _productRepository.Object,
                _userRepository.Object,
                _vehicleRepository.Object,
                _driverRepository.Object,
                configurationMock.Object
            );
        }

        public void Dispose()
        {
            if (Directory.Exists(_tempContentRoot))
            {
                Directory.Delete(_tempContentRoot, recursive: true);
            }
        }

        [Fact]
        public async Task PhotoService_UploadImageAsync_ShouldUpdateVehiclePhoto_WhenEntityFolderIsVehicles()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var vehicle = new Vehicle { Id = vehicleId };
            _vehicleRepository.Setup(r => r.GetByIdAsync(vehicleId)).ReturnsAsync(vehicle);
            var file = CreateFakeImageFile("vehicle-photo.jpg");

            // Act
            var fileName = await _service.UploadImageAsync("Vehicles", vehicleId, file);

            // Assert
            Assert.False(string.IsNullOrEmpty(fileName));
            Assert.Equal(fileName, vehicle.Photo);
            _vehicleRepository.Verify(r => r.UpdateAsync(vehicle), Times.Once);
        }

        [Fact]
        public async Task PhotoService_UploadImageAsync_ShouldUpdateDriverPhoto_WhenEntityFolderIsDrivers()
        {
            // Arrange
            var driverId = Guid.NewGuid();
            var driver = new Driver { Id = driverId };
            _driverRepository.Setup(r => r.GetByIdAsync(driverId)).ReturnsAsync(driver);
            var file = CreateFakeImageFile("driver-photo.png");

            // Act
            var fileName = await _service.UploadImageAsync("Drivers", driverId, file);

            // Assert
            Assert.False(string.IsNullOrEmpty(fileName));
            Assert.Equal(fileName, driver.Photo);
            _driverRepository.Verify(r => r.UpdateAsync(driver), Times.Once);
        }

        [Fact]
        public async Task PhotoService_UploadImageAsync_ShouldClearVehiclePhoto_WhenFileIsNull()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var vehicle = new Vehicle { Id = vehicleId, Photo = "old-photo.jpg" };
            _vehicleRepository.Setup(r => r.GetByIdAsync(vehicleId)).ReturnsAsync(vehicle);

            // Act
            var fileName = await _service.UploadImageAsync("Vehicles", vehicleId, null);

            // Assert
            Assert.Equal(string.Empty, fileName);
            Assert.Null(vehicle.Photo);
            _vehicleRepository.Verify(r => r.UpdateAsync(vehicle), Times.Once);
        }

        private static IFormFile CreateFakeImageFile(string fileName)
        {
            var content = Encoding.UTF8.GetBytes("fake-image-content");
            var stream = new MemoryStream(content);
            return new FormFile(stream, 0, content.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = "image/jpeg",
            };
        }
    }
}
