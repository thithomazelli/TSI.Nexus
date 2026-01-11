using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.WebAPI.Controllers
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
            var userName = User.FindFirst(ClaimTypes.Email)?.Value ?? string.Empty;
            return await _userManagerService.RefreshUserToken(userName);
        }

        [HttpPost("login")]
        public async Task<ActionResult<UserDto>> Login(LoginDto model)  
        {
            return await _userManagerService.Login(model);
        }

        [HttpPost("register")]
        public async Task<ActionResult<WebApiResponse<User>>> Register(RegisterDto model)
        {
            return await _userManagerService.Register(model);
        }

        [HttpPut("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto model)
        {
            return await _userManagerService.ConfirmEmail(model);
        }

        [HttpPost("resend-email-confirmation/{email}")]
        public async Task<IActionResult> ResendEmailConfirmation(string email)
        {
            return await _userManagerService.ResendEmailConfirmation(email);
        }

        [HttpPost("forgot-username-or-password/{email}")]
        public async Task<IActionResult> ForgotUsernameOrPassword(string email)
        {
            return await _userManagerService.ForgotUsernameOrPassword(email);
        }

        [HttpPut("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            return await _userManagerService.ResetPassword(model);
        }
    }
}
