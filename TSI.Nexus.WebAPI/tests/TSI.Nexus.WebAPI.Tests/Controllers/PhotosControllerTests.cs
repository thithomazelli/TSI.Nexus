using System;
using System.IO;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class PhotosControllerTests
    {
        private readonly PhotosController _controller;
        private readonly Mock<IPhotoService> _photoServiceMock;

        public PhotosControllerTests()
        {
            _photoServiceMock = new Mock<IPhotoService>();
            _controller = new PhotosController(_photoServiceMock.Object);
        }

        [Fact]
        public async Task PhotosController_UploadPhoto_ShouldReturnOkWithFileName_WhenMethodIsCalled()
        {
            // Arrange
            var entityId = Guid.NewGuid();
            var fileMock = new Mock<IFormFile>();

            _photoServiceMock
                .Setup(_ => _.UploadImageAsync("Products", entityId, fileMock.Object))
                .ReturnsAsync("photo.jpg");

            // Act
            var result = await _controller.UploadPhoto("Products", entityId, fileMock.Object);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);

            _photoServiceMock.Verify(
                _ => _.UploadImageAsync("Products", entityId, fileMock.Object),
                Times.Once
            );
        }

        [Fact]
        public void PhotosController_GetPhoto_ShouldReturnFile_WhenPhotoIsFound()
        {
            // Arrange
            var entityId = Guid.NewGuid();
            var fileResult = new AttachmentFileResult
            {
                Stream = new MemoryStream(new byte[] { 1, 2, 3 }),
                ContentType = "image/jpeg",
                FileName = "photo.jpg",
            };
            var expectedResult = new WebApiResponse<AttachmentFileResult>
            {
                Data = fileResult,
                Status = ResponseStatus.Success,
                Message = "Foto encontrada com sucesso",
            };

            _photoServiceMock
                .Setup(_ => _.GetPhotoFile("Products", entityId, "photo.jpg"))
                .Returns(expectedResult);

            // Act
            var result = _controller.GetPhoto("Products", entityId, "photo.jpg");

            // Assert
            var fileStreamResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("image/jpeg", fileStreamResult.ContentType);
            Assert.Equal("photo.jpg", fileStreamResult.FileDownloadName);
        }

        [Fact]
        public void PhotosController_GetPhoto_ShouldReturnNotFound_WhenPhotoIsNotFound()
        {
            // Arrange
            var entityId = Guid.NewGuid();
            var expectedResult = new WebApiResponse<AttachmentFileResult>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = "Foto não encontrada",
            };

            _photoServiceMock
                .Setup(_ => _.GetPhotoFile("Products", entityId, "photo.jpg"))
                .Returns(expectedResult);

            // Act
            var result = _controller.GetPhoto("Products", entityId, "photo.jpg");

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Foto não encontrada", notFoundResult.Value);
        }
    }
}
