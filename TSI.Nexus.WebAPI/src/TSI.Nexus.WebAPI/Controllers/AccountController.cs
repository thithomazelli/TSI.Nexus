using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IUserManagerService _userManagerService;

        public AccountController(IUserManagerService userManagerService)
        {
            _userManagerService = userManagerService;
        }

        [Authorize]
        [HttpGet("refresh-user-token")]
        public async Task<ActionResult<UserDto>> RefreshUserToken()
        {
            var userName = User.FindFirst(ClaimTypes.Name)?.Value ?? string.Empty;
            return await _userManagerService.RefreshUserToken(userName);
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto model)
        {
            return await _userManagerService.Login(model);
        }

        /// <summary>
        /// Updates the authenticated user's own theme/language preferences (profile dropdown or
        /// profile page). Always targets the caller's own account, never another user's.
        /// </summary>
        [Authorize]
        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences(UpdatePreferencesDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? string.Empty;
            var webApiResponse = await _userManagerService.UpdatePreferences(userId, model);
            return Ok(webApiResponse);
        }

        [AllowAnonymous]
        [HttpPost("register")]
        public async Task<ActionResult<WebApiResponse<User>>> Register(RegisterDto model)
        {
            return await _userManagerService.Register(model);
        }

        [AllowAnonymous]
        [HttpPut("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto model)
        {
            return await _userManagerService.ConfirmEmail(model);
        }

        [AllowAnonymous]
        [HttpPost("resend-email-confirmation/{email}")]
        public async Task<IActionResult> ResendEmailConfirmation(string email)
        {
            return await _userManagerService.ResendEmailConfirmation(email);
        }

        [AllowAnonymous]
        [HttpPost("forgot-username-or-password/{email}")]
        public async Task<IActionResult> ForgotUsernameOrPassword(string email)
        {
            return await _userManagerService.ForgotUsernameOrPassword(email);
        }

        [AllowAnonymous]
        [HttpPut("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            return await _userManagerService.ResetPassword(model);
        }
    }
}
