using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class QuoteTripLegsControllerTests
    {
        private readonly QuoteTripLegsController _controller;
        private readonly Mock<IQuoteTripLegService> _serviceMock;

        public QuoteTripLegsControllerTests()
        {
            _serviceMock = new Mock<IQuoteTripLegService>();
            _controller = new QuoteTripLegsController(_serviceMock.Object);
        }

        [Fact]
        public async Task QuoteTripLegsController_Add_ShouldAddQuoteTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var quoteTripLegMock = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteTripLeg>
            {
                Data = quoteTripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho do itinerário cadastrado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Add(It.IsAny<QuoteTripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(quoteTripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteTripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Add(It.IsAny<QuoteTripLeg>()), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegsController_Add_ShouldNotAddQuoteTripLeg_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var quoteTripLegMock = new QuoteTripLeg();
            _controller.ModelState.AddModelError("QuoteTripId", "QuoteTripId is required");

            // Act
            var result = await _controller.Add(quoteTripLegMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("QuoteTripId"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<QuoteTripLeg>()), Times.Never);
        }

        [Fact]
        public async Task QuoteTripLegsController_Update_ShouldUpdateQuoteTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var quoteTripLegMock = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteTripLeg>
            {
                Data = quoteTripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho do itinerário atualizado com sucesso.",
            };

            _serviceMock.Setup(_ => _.Update(It.IsAny<QuoteTripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(quoteTripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteTripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<QuoteTripLeg>()), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegsController_Remove_ShouldRemoveQuoteTripLegSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var quoteTripLegMock = new QuoteTripLeg { Id = Guid.NewGuid(), QuoteTripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteTripLeg>
            {
                Data = quoteTripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho do itinerário removido com sucesso.",
            };

            _serviceMock.Setup(_ => _.Remove(It.IsAny<QuoteTripLeg>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(quoteTripLegMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteTripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<QuoteTripLeg>()), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegsController_GetById_ShouldGetQuoteTripLegById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.NewGuid();
            var quoteTripLegMock = new QuoteTripLeg { Id = idMock, QuoteTripId = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<QuoteTripLeg>
            {
                Data = quoteTripLegMock,
                Status = ResponseStatus.Success,
                Message = "Trecho do itinerário encontrado com sucesso",
            };

            _serviceMock.Setup(_ => _.FindById(It.IsAny<Guid?>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<QuoteTripLeg>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(quoteTripLegMock, response.Data);

            _serviceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }

        [Fact]
        public async Task QuoteTripLegsController_GetByQuoteTrip_ShouldGetQuoteTripLegsForQuoteTrip_WhenMethodIsCalled()
        {
            // Arrange
            var quoteTripId = Guid.NewGuid();
            var quoteTripLegsMock = new List<QuoteTripLeg> { new() { Id = Guid.NewGuid(), QuoteTripId = quoteTripId } };
            var expectedResult = new WebApiResponse<IEnumerable<QuoteTripLeg>>
            {
                Data = quoteTripLegsMock,
                Status = ResponseStatus.Success,
                Message = $"{quoteTripLegsMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindByQuoteTrip(It.IsAny<Guid>())).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByQuoteTrip(quoteTripId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<QuoteTripLeg>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(quoteTripLegsMock, response.Data);

            _serviceMock.Verify(_ => _.FindByQuoteTrip(It.IsAny<Guid>()), Times.Once);
        }
    }
}
