using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
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
