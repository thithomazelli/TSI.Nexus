using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class UsersControllerTests
    {
        private readonly UsersController _usersController;
        private readonly Mock<IUserManagerService> _userManagerServiceMock;

        public UsersControllerTests()
        {
            _userManagerServiceMock = new Mock<IUserManagerService>();
            _usersController = new UsersController(_userManagerServiceMock.Object);
        }

        [Fact]
        public async Task UsersController_Add_ShouldReturnWebApiResponse_WhenMethodIsCalled()
        {
            // Arrange
            var model = new RegisterDto
            {
                FirstName = "Joao",
                LastName = "Silva",
                Email = "joao@tsi.com.br",
                Password = "123456",
            };
            var expectedResult = new WebApiResponse<User>
            {
                Data = new User { Id = "1" },
                Status = ResponseStatus.Success,
                Message = "Usuário cadastrado com sucesso.",
            };

            _userManagerServiceMock.Setup(_ => _.Register(model)).ReturnsAsync(expectedResult);

            // Act
            var result = await _usersController.Add(model);

            // Assert
            Assert.Equal(expectedResult, result.Value);
            _userManagerServiceMock.Verify(_ => _.Register(model), Times.Once);
        }

        [Fact]
        public async Task UsersController_Update_ShouldUpdateUserSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var userMock = new User { Id = "1", FirstName = "Joao", LastName = "Silva" };
            var expectedResult = new WebApiResponse<UserDto>
            {
                Data = new UserDto { Id = "1", FirstName = "Joao" },
                Status = ResponseStatus.Success,
                Message = "Usuário atualizado com sucesso.",
            };

            _userManagerServiceMock.Setup(_ => _.Update(userMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _usersController.Update(userMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<UserDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _userManagerServiceMock.Verify(_ => _.Update(userMock), Times.Once);
        }

        [Fact]
        public async Task UsersController_Update_ShouldNotUpdateUser_WhenMethodIsCalledWithAnInvalidObject()
        {
            // Arrange
            var userMock = new User();
            _usersController.ModelState.AddModelError("FirstName", "FirstName is required");

            // Act
            var result = await _usersController.Update(userMock);

            // Assert
            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var modelState = Assert.IsType<SerializableError>(badRequest.Value);
            Assert.True(modelState.ContainsKey("FirstName"));

            _userManagerServiceMock.Verify(_ => _.Update(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task UsersController_Remove_ShouldRemoveUserSuccessfully_WhenMethodIsCalled()
        {
            // Arrange
            var userMock = new User { Id = "1", FirstName = "Joao", LastName = "Silva" };
            var expectedResult = new WebApiResponse<UserDto>
            {
                Data = new UserDto { Id = "1" },
                Status = ResponseStatus.Success,
                Message = "Usuário removido com sucesso.",
            };

            _userManagerServiceMock.Setup(_ => _.Remove(userMock)).ReturnsAsync(expectedResult);

            // Act
            var result = await _usersController.Remove(userMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<UserDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);

            _userManagerServiceMock.Verify(_ => _.Remove(userMock), Times.Once);
        }

        [Fact]
        public async Task UsersController_GetAll_ShouldGetAllUsers_WhenMethodIsCalled()
        {
            // Arrange
            var userMock = new List<UserDto>
            {
                new() {
                    Id = "1",
                    FirstName = "Thiago",
                    LastName =  "Thomazelli Ferreira",
                    Email = "thiago.thomazelli@tsi.com.br",
                    EmailConfirmed = true,
                },
                new() {
                    Id = "2",
                    FirstName = "Leonardo",
                    LastName =  "Thomazelli Ferreira",
                    Email = "leonardo.thomazelli@tsi.com.br",
                    EmailConfirmed = true,
                },
            };

            var expectedResult = new WebApiResponse<IEnumerable<UserDto>>
            {
                Data = userMock,
                Status = ResponseStatus.Success,
                Message = $"{userMock.Count()} registro(s) encontrado(s)."
            };

            _userManagerServiceMock.Setup(_ => _.FindAll())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _usersController.GetAll();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<UserDto>>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(userMock, response.Data);

            _userManagerServiceMock.Verify(_ => _.FindAll(), Times.Once);
        }

        [Fact]
        public async Task UsersController_GetById_ShouldGetUserById_WhenMethodIsCalled()
        {
            // Arrange
            const string idMock = "1";
            var userMock = new UserDto
            {
                Id = "1",
                FirstName = "Thiago",
                LastName = "Thomazelli Ferreira",
                Email = "thiago.thomazelli@tsi.com.br",
                EmailConfirmed = true,
            };

            var expectedResult = new WebApiResponse<UserDto>
            {
                Data = userMock,
                Status = ResponseStatus.Success,
                Message = $"Usuário {userMock.UserName} encontrado com sucesso"
            };

            _userManagerServiceMock.Setup(_ => _.FindById(It.IsAny<string>()))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _usersController.GetById(idMock);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<UserDto>>(okResult.Value);
            Assert.Equal(ResponseStatus.Success, response.Status);
            Assert.Equal(userMock, response.Data);

            _userManagerServiceMock.Verify(_ => _.FindById(It.IsAny<string>()), Times.Once);
        }
    }
}
