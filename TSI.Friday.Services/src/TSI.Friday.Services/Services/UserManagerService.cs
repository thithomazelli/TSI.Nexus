using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Services.Services
{
    public class UserManagerService : ControllerBase, IUserManagerService
    {
        private readonly IJwtService _jwtService;
        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;

        public UserManagerService(
            IJwtService jwtService,
            SignInManager<User> signInManager,
            UserManager<User> userManager)
        {
            _jwtService = jwtService;
            _signInManager = signInManager;
            _userManager = userManager;
        }

        #region Public methods

        /// <inheritdoc />
        public async Task<ActionResult<UserDto>> Login(LoginDto model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName);

            if (user == null)
            {
                return Unauthorized("Invalid username or password.");
            }

            if (user.EmailConfirmed == false)
            {
                return Unauthorized("Please confirm you email.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized("Invalid username or password");
            }

            return CreateApplicationUserDto(user);
        }

        /// <inheritdoc />
        public async Task<IActionResult> Register(RegisterDto model)
        {
            if (await CheckEmailExistisAsync(model.Email))
            {
                return BadRequest($"An existing account is using {model.Email}, email address. Please try with another email address");
            }

            var userToAdd = new User
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                UserName = model.Email,
                Email = model.Email,
                EmailConfirmed = true,
            };

            var result = await _userManager.CreateAsync(userToAdd, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            return Ok(new JsonResult(new
            {
               title = "Account Created",
               message = "Your account has been created, you can login",
            }));
        }

        /// <inheritdoc />
        public async Task<ActionResult<UserDto>> RefreshUserToken(string userName)
        {
            var user = await _userManager.FindByNameAsync(userName);

            if (user == null)
            {
                return Unauthorized("User was not found.");
            }

            return CreateApplicationUserDto(user);
        }

        #endregion

        #region Private Helper Methods

        private UserDto CreateApplicationUserDto(User user)
        {
            return new UserDto
            {
                FirstName = user.FirstName,
                LastName = user.LastName,
                JWT = _jwtService.CreateJWT(user),
            };
        }

        private async Task<bool> CheckEmailExistisAsync(string email)
        {
            return await _userManager.Users.AnyAsync(_ => _.Email == email.ToLower());
        }

        #endregion 
    }
}
