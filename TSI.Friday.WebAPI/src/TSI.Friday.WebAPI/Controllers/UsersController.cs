using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.WebAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserManagerService _userManagerService;

        public UsersController(IUserManagerService userManagerService)
        {
            _userManagerService = userManagerService;
        }

        [HttpPost("add")]
        [Authorize(Roles = "Admin,Master")]
        public async Task<ActionResult<WebApiResponse<User>>> Add(RegisterDto model)
        {
            return await _userManagerService.Register(model);
        }

        /// <summary>
        /// Update user available on database
        /// </summary>
        /// <param name="user">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] User user)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _userManagerService.Update(user);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove user when it is identified on database
        /// </summary>
        /// <param name="user">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        [Authorize(Roles = "Admin,Master")]
        public async Task<IActionResult> Remove([FromBody] User user)
        {
            var webApiResponse = await _userManagerService.Remove(user);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all users available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        [Authorize(Roles = "Admin,Master")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _userManagerService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get user by id
        /// </summary>
        /// <param name="userId">User id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetById/{userId}")]
        public async Task<IActionResult> GetById(string userId)
        {
            var webApiResponse = await _userManagerService.FindById(userId);
            return Ok(webApiResponse);
        }
    }
}
