using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// Defines the contract for user management services, including login, registration, and account recovery.
    /// </summary>
    public interface IUserManagerService
    {
        /// <summary>
        /// Authenticates a user and generates a token for accessing the system.
        /// </summary>
        /// <param name="model">The login details, including username and password.</param>
        /// <returns>
        /// An <see cref="ActionResult{T}"/> containing the authenticated user's details and token if successful.
        /// </returns>
        Task<ActionResult<UserDto>> Login(LoginDto model);

        /// <summary>
        /// Registers a new user in the system.
        /// </summary>
        /// <param name="model">The registration details, including username, email, and password.</param>
        /// <returns>
        /// An <see cref="IActionResult"/> indicating the result of the registration process.
        /// </returns>
        Task<IActionResult> Register(RegisterDto model);

        /// <summary>
        /// Refreshes the authentication token for a user.
        /// </summary>
        /// <param name="userName">The username of the user requesting a token refresh.</param>
        /// <returns>
        /// An <see cref="ActionResult{T}"/> containing the refreshed token and user details.
        /// </returns>
        Task<ActionResult<UserDto>> RefreshUserToken(string userName);

        /// <summary>
        /// Confirms a user's email address using a confirmation token.
        /// </summary>
        /// <param name="model">The email confirmation details, including user ID and token.</param>
        /// <returns>
        /// An <see cref="IActionResult"/> indicating the result of the email confirmation process.
        /// </returns>
        Task<IActionResult> ConfirmEmail(ConfirmEmailDto model);

        /// <summary>
        /// Resends the email confirmation link to the specified email address.
        /// </summary>
        /// <param name="email">The email address to which the confirmation link will be sent.</param>
        /// <returns>
        /// An <see cref="IActionResult"/> indicating the result of the resend operation.
        /// </returns>
        Task<IActionResult> ResendEmailConfirmation(string email);

        /// <summary>
        /// Initiates the process to recover a forgotten username or reset a password.
        /// </summary>
        /// <param name="email">The email address associated with the user's account.</param>
        /// <returns>
        /// An <see cref="IActionResult"/> indicating the result of the recovery process.
        /// </returns>
        Task<IActionResult> ForgotUsernameOrPassword(string email);

        /// <summary>
        /// 
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        Task<IActionResult> ResetPassword(ResetPasswordDto model);
    }
}
