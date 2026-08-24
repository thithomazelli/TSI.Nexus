using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class AddressesControllerTests
    {
        private readonly AddressesController _addressesController;
        private readonly Mock<IAddressService> _addressServiceMock;

        public AddressesControllerTests()
        {
            _addressServiceMock = new Mock<IAddressService>();
            _addressesController = new AddressesController(_addressServiceMock.Object);
        }

        [Fact]
        public async Task AddressesController_Add_ShouldAddAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = new AddressDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = AddressType.Home,
                ZipCode = "09240110",
                Street = "Rua Boa Vista",
                Number = 950,
                State = "SP",
                City = "Santo André",
                Country = "BR",
                Comments = "Casa",
            };

            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = $"Endereço {addressMock.Street} cadastrado com sucesso.",
            };

            _addressServiceMock
                .Setup(_ => _.Add(It.IsAny<AddressDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _addressesController.Add(addressMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AddressDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(addressMock, response.Data);

            _addressServiceMock.Verify(_ => _.Add(It.IsAny<AddressDto>()), Times.Once);
        }

        [Fact]
        public async Task AddressesController_Add_ShouldNotAddAddressSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var addressMock = new AddressDto();

            _addressesController.ModelState.AddModelError("Name", "Name is required");

            _addressServiceMock.Setup(_ => _.Add(It.IsAny<AddressDto>()));

            // Act
            var result = await _addressesController.Add(addressMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("Name"));

            _addressServiceMock.Verify(_ => _.Add(It.IsAny<AddressDto>()), Times.Never);
        }

        [Fact]
        public async Task AddressesController_Update_ShouldUpdateAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = new AddressDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = AddressType.Home,
                ZipCode = "09240110",
                Street = "Rua Boa Vista",
                Number = 950,
                State = "SP",
                City = "Santo André",
                Country = "BR",
                Comments = "Casa",
            };

            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = $"Endereço {addressMock.Street} atualizado com sucesso.",
            };

            _addressServiceMock
                .Setup(_ => _.Update(It.IsAny<AddressDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _addressesController.Update(addressMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AddressDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(addressMock, response.Data);

            _addressServiceMock.Verify(_ => _.Update(It.IsAny<AddressDto>()), Times.Once);
        }

        [Fact]
        public async Task AddressesController_Update_ShouldNotUpdateAddressSuccessfully_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var addressMock = new AddressDto();

            _addressesController.ModelState.AddModelError("ZipCode", "ZipCode is invalid");

            _addressServiceMock.Setup(_ => _.Update(It.IsAny<AddressDto>()));

            // Act
            var result = await _addressesController.Update(addressMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("ZipCode"));

            _addressServiceMock.Verify(_ => _.Update(It.IsAny<AddressDto>()), Times.Never);
        }

        [Fact]
        public async Task AddressesController_Remove_ShouldRemoveAddressSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var addressMock = new AddressDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = AddressType.Home,
                ZipCode = "09240110",
                Street = "Rua Boa Vista",
                Number = 950,
                State = "SP",
                City = "Santo André",
                Country = "BR",
                Comments = "Casa",
            };

            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = $"Endereço {addressMock.Street} removido com sucesso.",
            };

            _addressServiceMock
                .Setup(_ => _.Remove(It.IsAny<AddressDto>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _addressesController.Remove(addressMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AddressDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(addressMock, response.Data);

            _addressServiceMock.Verify(_ => _.Remove(It.IsAny<AddressDto>()), Times.Once);
        }

        [Fact]
        public async Task AddressesController_GetAllByBusinessPartnerId_ShouldGetAllAddressesByBusinessPartner_WhenMethodIsCalled()
        {
            // Arrange
            var businessPartnerIdMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var addressMock = new List<AddressDto>
            {
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Type = AddressType.Home,
                    ZipCode = "09240110",
                    Street = "Rua Boa Vista",
                    Number = 950,
                    State = "SP",
                    City = "Santo André",
                    Country = "BR",
                    Comments = "Casa",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new()
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Type = AddressType.Office,
                    ZipCode = "09240110",
                    Street = "Rua Boa Vista",
                    Number = 950,
                    State = "SP",
                    City = "Santo André",
                    Country = "BR",
                    Comments = "Casa",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<AddressDto>>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = $"{addressMock.Count()} registro(s) encontrado(s).",
            };

            _addressServiceMock
                .Setup(_ => _.FindByBusinessPartnerId(It.IsAny<Guid>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _addressesController.GetAllByBusinessPartnerId(
                businessPartnerIdMock
            );

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<AddressDto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(addressMock, response.Data);

            _addressServiceMock.Verify(
                _ => _.FindByBusinessPartnerId(It.IsAny<Guid>()),
                Times.Once
            );
        }

        [Fact]
        public async Task AddressesController_GetById_ShouldGetAddressById_WhenMethodIsCalled()
        {
            // Arrange
            var idMock = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var addressMock = new AddressDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = AddressType.Home,
                ZipCode = "09240110",
                Street = "Rua Boa Vista",
                Number = 950,
                State = "SP",
                City = "Santo André",
                Country = "BR",
                Comments = "Casa",
                BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
            };

            var expectedResult = new WebApiResponse<AddressDto>
            {
                Data = addressMock,
                Status = ResponseStatus.Success,
                Message = $"Endereço {addressMock.Street} encontrado com sucesso",
            };

            _addressServiceMock
                .Setup(_ => _.FindById(It.IsAny<Guid?>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _addressesController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<AddressDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(addressMock, response.Data);

            _addressServiceMock.Verify(_ => _.FindById(It.IsAny<Guid?>()), Times.Once);
        }
    }
}
