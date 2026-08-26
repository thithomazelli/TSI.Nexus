using System.IO;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class AttachmentsControllerTests
    {
        private readonly AttachmentsController _controller;
        private readonly Mock<IAttachmentService> _serviceMock;

        public AttachmentsControllerTests()
        {
            _serviceMock = new Mock<IAttachmentService>();
            _controller = new AttachmentsController(_serviceMock.Object);
        }

        private static AttachmentResponseDto BuildResponse(Guid? id = null) =>
            new()
            {
                Id = id ?? Guid.NewGuid(),
                FileName = "doc.pdf",
                Path = "BusinessPartners/ClienteX",
                DownloadUrl = "/api/Attachments/GetFileById/1",
            };

        [Fact]
        public async Task AttachmentsController_Add_ShouldReturnWebApiResponse_WhenMethodIsCalled()
        {
            // Arrange
            var dto = new AttachmentDto { BusinessPartnerId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<AttachmentResponseDto>
            {
                Data = BuildResponse(),
                Status = ResponseStatus.Success,
                Message = "Anexo cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(dto, "override")).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(dto, "override");

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.Add(dto, "override"), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_Update_ShouldReturnWebApiResponse_WhenMethodIsCalled()
        {
            // Arrange
            var dto = new AttachmentDto { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<AttachmentResponseDto>
            {
                Data = BuildResponse(dto.Id),
                Status = ResponseStatus.Success,
                Message = "Anexo atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(dto, "override")).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(dto, "override");

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.Update(dto, "override"), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_Delete_ShouldReturnWebApiResponse_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<AttachmentResponseDto>
            {
                Data = BuildResponse(id),
                Status = ResponseStatus.Success,
                Message = "Anexo removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Delete(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Delete(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.Delete(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetById_ShouldReturnWebApiResponse_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<AttachmentResponseDto>
            {
                Data = BuildResponse(id),
                Status = ResponseStatus.Success,
                Message = "Anexo encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.GetById(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetById(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetFileById_ShouldReturnFile_WhenAttachmentIsFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var fileResult = new AttachmentFileResult
            {
                Stream = new MemoryStream(new byte[] { 1, 2, 3 }),
                ContentType = "application/pdf",
                FileName = "doc.pdf",
            };
            var expectedResult = new WebApiResponse<AttachmentFileResult>
            {
                Data = fileResult,
                Status = ResponseStatus.Success,
                Message = "Anexo encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.GetFileById(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetFileById(id);

            // Assert
            var fileStreamResult = Assert.IsType<FileStreamResult>(result);
            Assert.Equal("application/pdf", fileStreamResult.ContentType);
            Assert.Equal("doc.pdf", fileStreamResult.FileDownloadName);
        }

        [Fact]
        public async Task AttachmentsController_GetFileById_ShouldReturnNotFound_WhenAttachmentIsNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<AttachmentFileResult>
            {
                Data = null,
                Status = ResponseStatus.Error,
                Message = "Anexo não encontrado",
            };

            _serviceMock.Setup(_ => _.GetFileById(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetFileById(id);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.Equal("Anexo não encontrado", notFoundResult.Value);
        }

        [Fact]
        public async Task AttachmentsController_GetByBusinessPartnerId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByBusinessPartnerId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByBusinessPartnerId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByBusinessPartnerId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByOrderId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByOrderId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByOrderId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByOrderId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByTripId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByTripId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTripId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByTripId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByPurchaseOrderId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByPurchaseOrderId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByPurchaseOrderId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByPurchaseOrderId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByTransactionId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByTransactionId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByTransactionId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByTransactionId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByPaymentId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByPaymentId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByPaymentId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByPaymentId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByProductId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByProductId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByProductId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByProductId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByVehicleId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByVehicleId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicleId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByVehicleId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByDriverId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByDriverId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByDriverId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByDriverId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByVehicleMaintenanceId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            var id = Guid.NewGuid();
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.GetByVehicleMaintenanceId(id))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByVehicleMaintenanceId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByVehicleMaintenanceId(id), Times.Once);
        }

        [Fact]
        public async Task AttachmentsController_GetByUserId_ShouldReturnAttachments_WhenMethodIsCalled()
        {
            // Arrange
            const string id = "1";
            var expectedResult = new WebApiResponse<IEnumerable<AttachmentResponseDto>>
            {
                Data = new List<AttachmentResponseDto> { BuildResponse() },
                Status = ResponseStatus.Success,
                Message = "1 registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.GetByUserId(id)).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByUserId(id);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _serviceMock.Verify(_ => _.GetByUserId(id), Times.Once);
        }
    }
}
