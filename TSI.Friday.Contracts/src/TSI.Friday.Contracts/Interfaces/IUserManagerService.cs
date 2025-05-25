using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// 
    /// </summary>
    public interface IUserManagerService
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        Task<ActionResult<UserDto>> Login(LoginDto model);

        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        Task<IActionResult> Register(RegisterDto model);

        /// <summary>
        /// 
        /// </summary>
        /// <param name="userName"></param>
        /// <returns></returns>
        Task<ActionResult<UserDto>> RefreshUserToken(string userName);
    }
}
