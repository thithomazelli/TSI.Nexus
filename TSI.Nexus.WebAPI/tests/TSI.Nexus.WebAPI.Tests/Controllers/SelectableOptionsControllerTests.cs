using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class SelectableOptionsControllerTests
    {
        private readonly SelectableOptionsController _controller;
        private readonly Mock<ISelectableOptionService> _serviceMock;

        public SelectableOptionsControllerTests()
        {
            _serviceMock = new Mock<ISelectableOptionService>();
            _controller = new SelectableOptionsController(_serviceMock.Object);
        }

        [Fact]
        public async Task SelectableOptionsController_Add_ShouldAddSelectableOptionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var optionMock = new SelectableOption
            {
                Id = Guid.NewGuid(),
                Group = SelectableOptionGroup.ProductCategory,
                Value = "Locação",
            };
            var expectedResult = new WebApiResponse<SelectableOption>
            {
                Data = optionMock,
                Status = ResponseStatus.Success,
                Message = "Opção cadastrada com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Add(It.IsAny<SelectableOption>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Add(optionMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<SelectableOption>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(optionMock, response.Data);

            _serviceMock.Verify(_ => _.Add(It.IsAny<SelectableOption>()), Times.Once);
        }

        [Fact]
        public async Task SelectableOptionsController_Add_ShouldNotAddSelectableOption_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var optionMock = new SelectableOption();
            _controller.ModelState.AddModelError("Value", "Value is required");

            // Act
            var result = await _controller.Add(optionMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Value"));

            _serviceMock.Verify(_ => _.Add(It.IsAny<SelectableOption>()), Times.Never);
        }

        [Fact]
        public async Task SelectableOptionsController_Update_ShouldUpdateSelectableOptionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var optionMock = new SelectableOption { Id = Guid.NewGuid(), Value = "Venda" };
            var expectedResult = new WebApiResponse<SelectableOption>
            {
                Data = optionMock,
                Status = ResponseStatus.Success,
                Message = "Opção atualizada com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Update(It.IsAny<SelectableOption>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Update(optionMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<SelectableOption>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Update(It.IsAny<SelectableOption>()), Times.Once);
        }

        [Fact]
        public async Task SelectableOptionsController_Update_ShouldNotUpdateSelectableOption_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var optionMock = new SelectableOption();
            _controller.ModelState.AddModelError("Value", "Value is required");

            // Act
            var result = await _controller.Update(optionMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Value"));

            _serviceMock.Verify(_ => _.Update(It.IsAny<SelectableOption>()), Times.Never);
        }

        [Fact]
        public async Task SelectableOptionsController_Remove_ShouldRemoveSelectableOptionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var optionMock = new SelectableOption { Id = Guid.NewGuid() };
            var expectedResult = new WebApiResponse<SelectableOption>
            {
                Data = optionMock,
                Status = ResponseStatus.Success,
                Message = "Opção removida com sucesso.",
            };

            _serviceMock
                .Setup(_ => _.Remove(It.IsAny<SelectableOption>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.Remove(optionMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<SelectableOption>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _serviceMock.Verify(_ => _.Remove(It.IsAny<SelectableOption>()), Times.Once);
        }

        [Fact]
        public async Task SelectableOptionsController_GetAll_ShouldGetAllSelectableOptions_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<SelectableOption> { new() { Id = Guid.NewGuid() } };
            var expectedResult = new WebApiResponse<IEnumerable<SelectableOption>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock.Setup(_ => _.FindAll()).ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<SelectableOption>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task SelectableOptionsController_GetByGroup_ShouldGetSelectableOptionsForGroup_WhenMethodIsCalled()
        {
            // Arrange
            var listMock = new List<SelectableOption>
            {
                new() { Id = Guid.NewGuid(), Group = SelectableOptionGroup.AddressType },
            };
            var expectedResult = new WebApiResponse<IEnumerable<SelectableOption>>
            {
                Data = listMock,
                Status = ResponseStatus.Success,
                Message = $"{listMock.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(_ => _.FindByGroup(SelectableOptionGroup.AddressType))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _controller.GetByGroup(SelectableOptionGroup.AddressType);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<SelectableOption>>>(
                okResult.Value
            );
            Assert.Equal(listMock, response.Data);

            _serviceMock.Verify(_ => _.FindByGroup(SelectableOptionGroup.AddressType), Times.Once);
        }
    }
}
