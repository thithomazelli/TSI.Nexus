using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using System.Threading.Tasks;

namespace TSI.Friday.Services
{
    public class UserManagerService : ControllerBase, IUserManagerService
    {
        #region Properties

        private readonly IJwtService _jwtService;
        private readonly SignInManager<User> _signInManager;
        private readonly UserManager<User> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _config;

        /// <summary>
        /// Repository object created to access the Users registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<User> _repository;

        #endregion Properties

        #region Public methods

        public UserManagerService(
            IJwtService jwtService,
            SignInManager<User> signInManager,
            UserManager<User> userManager,
            IEmailService emailService,
            IConfiguration config,
            IRepository<User> repository
        )
        {
            _jwtService = jwtService;
            _signInManager = signInManager;
            _userManager = userManager;
            _emailService = emailService;
            _config = config;
            _repository = repository;
        }

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

            return await CreateApplicationUserDto(user);
        }

        /// <inheritdoc />
        public async Task<ActionResult<UserDto>> RefreshUserToken(string userName)
        {
            var user = await _userManager.FindByNameAsync(userName);

            if (user == null)
            {
                return Unauthorized("User was not found.");
            }

            return await CreateApplicationUserDto(user);
        }

        /// <inheritdoc />
        public async Task<ActionResult<WebApiResponse<User>>> Register(RegisterDto model)
        {
            if (await CheckEmailExistisAsync(model.Email))
            {
                return BadRequest(
                    $"An existing account is using {model.Email}, email address. Please try with another email address"
                );
            }

            var userToAdd = new User
            {
                FirstName = model.FirstName,
                LastName = model.LastName,
                UserName = model.Email,
                Email = model.Email,
            };

            var result = await _userManager.CreateAsync(userToAdd, model.Password);

            if (!result.Succeeded)
            {
                return BadRequest(result.Errors);
            }

            // assign role if provided
            if (!string.IsNullOrEmpty(model.Role))
            {
                try
                {
                    var roleResult = await _userManager.AddToRoleAsync(userToAdd, model.Role);
                    if (!roleResult.Succeeded)
                    {
                        // log but don't fail the entire registration
                        // consider removing the user if role assignment is critical
                    }
                }
                catch
                {
                    // swallow role assignment errors to avoid breaking registration
                }
            }

            try
            {
                if (!(await SendConfirmEmailAsync(userToAdd)))
                {
                    throw new Exception();
                }

                return Ok(
                    new WebApiResponse<User>
                    {
                        Data = userToAdd,
                        Status = ResponseStatus.Success,
                        Message = "User registered successfully.",
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Failed to send email. Please contact admin. Error: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized("This email address has not been registered yet.");
            }

            if (user.EmailConfirmed)
            {
                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Email is already confirmed",
                            message = "Your email has been confirmed successfully. You can login now.",
                        }
                    )
                );
            }

            try
            {
                var decodedTokenBytes = WebEncoders.Base64UrlDecode(model.Token);
                var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

                var result = await _userManager.ConfirmEmailAsync(user, decodedToken);

                if (!result.Succeeded)
                {
                    throw new Exception("Invalid token. Please try again.");
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Email Confirmed",
                            message = "Your email has been confirmed successfully. You can login now.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Failed to confirm email. Please contact admin. Error: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ResendEmailConfirmation(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Invalid email.");
            }

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Unauthorized("This email address has not been registered yet.");
            }

            if (user.EmailConfirmed)
            {
                return BadRequest(
                    "Your email address was confirmed before. Please login to your account."
                );
            }

            try
            {
                if (!(await SendConfirmEmailAsync(user)))
                {
                    throw new Exception();
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Confirmation link sent",
                            message = "Please confirm your email address",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Failed to send email. Please contact admin. Error: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ForgotUsernameOrPassword(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("Invalid email.");
            }

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Unauthorized("This email address has not been registered yet.");
            }

            if (!user.EmailConfirmed)
            {
                return BadRequest("Please confirm your email address first.");
            }

            try
            {
                if (!(await SendForgotUsernameOrPasswordEmail(user)))
                {
                    throw new Exception();
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Forgot username or password email sent",
                            message = "Please check your email address",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Failed to send email. Please contact admin. Error: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized("This email address has not been registered yet.");
            }

            if (!user.EmailConfirmed)
            {
                return BadRequest("Please confirm your email address first.");
            }

            try
            {
                var decodedTokenBytes = WebEncoders.Base64UrlDecode(model.Token);
                var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

                var result = await _userManager.ResetPasswordAsync(
                    user,
                    decodedToken,
                    model.NewPassword
                );

                if (!result.Succeeded)
                {
                    throw new Exception("Invalid token. Please try again.");
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Password reset success",
                            message = "Your password has been reset successfully.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Failed to reset password. Please contact admin. Error: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<User>> Update(User user)
        {
            WebApiResponse<User> result = new();

            try
            {
                if (string.IsNullOrEmpty(user.Email))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = "Email inválido";
                    return result;
                }

                var userDuplicatedMessage = await _repository.AnyAsync(_ =>
                    _.Id != user.Id && _.Email == user.Email.ToLower()
                );

                if (userDuplicatedMessage)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = "Já existe um usuário cadastrado com o email informado";
                    return result;
                }

                var userToUpdate = await _repository.GetByIdAsync(user.Id);
                userToUpdate.Email = user.Email;
                userToUpdate.FirstName = user.FirstName;
                userToUpdate.LastName = user.LastName;

                await _repository.UpdateAsync(userToUpdate);

                // Handle role updates if a role was provided in the payload
                if (!string.IsNullOrEmpty(user.Role))
                {
                    try
                    {
                        var currentRoles = await _userManager.GetRolesAsync(userToUpdate);

                        // If the desired role is not present, add it
                        if (!currentRoles.Contains(user.Role))
                        {
                            var addRoleResult = await _userManager.AddToRoleAsync(userToUpdate, user.Role);
                            if (!addRoleResult.Succeeded)
                            {
                                // Log or aggregate errors as needed; do not fail the whole update
                                // You could set result as warning here if desired
                            }
                        }

                        // Remove any other roles the user had (keeping single-role model)
                        foreach (var existing in currentRoles)
                        {
                            if (existing != user.Role)
                            {
                                try
                                {
                                    await _userManager.RemoveFromRoleAsync(userToUpdate, existing);
                                }
                                catch
                                {
                                    // ignore individual removal failures
                                }
                            }
                        }
                    }
                    catch
                    {
                        // ignore role assignment errors to avoid breaking update; consider logging
                    }
                }

                result.Data = user;
                result.Status = ResponseStatus.Success;
                result.Message = $"Usuário {user.UserName} atualizado com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível atualizar os dados do Usuário {user.UserName} na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<User>> Remove(User user)
        {
            WebApiResponse<User> result = new();

            try
            {
                await _repository.RemoveAsync(user);

                result.Data = user;
                result.Status = ResponseStatus.Success;
                result.Message = $"Usuário {user.UserName} removido com sucesso.";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível remover o Usuário {user.UserName} da base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<IEnumerable<User>>> FindAll()
        {
            WebApiResponse<IEnumerable<User>> result = new();

            try
            {
                result.Data = await _repository.GetAllAsync();
                result.Status = ResponseStatus.Success;
                result.Message = $"{result.Data.Count()} registro(s) encontrado(s).";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Usuários na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<User>> FindById(string id)
        {
            WebApiResponse<User> result = new();

            try
            {
                result.Data = await _repository.GetByIdAsync(id);
                result.Status = ResponseStatus.Success;
                result.Message =
                    result.Data != null
                        ? $"Usuário {result.Data.UserName} encontrado com sucesso"
                        : $"Nenhum Usuário com o ID {id} foi encontrado";
            }
            catch (Exception ex)
            {
                result.Status = ResponseStatus.Error;
                result.Message =
                    $"Não foi possível acessar os registros de Usuários na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion

        #region Private Helper Methods

        private async Task<UserDto> CreateApplicationUserDto(User user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            return new UserDto
            {
                Id = user.Id,
                UserName = user.UserName,
                Email = user.Email,
                EmailConfirmed = user.EmailConfirmed,
                FirstName = user.FirstName,
                LastName = user.LastName,
                JWT = _jwtService.CreateJWT(user, roles),
                Photo = user.Photo,
            };
        }

        private async Task<bool> CheckEmailExistisAsync(string email)
        {
            return await _userManager.Users.AnyAsync(_ => _.Email == email.ToLower());
        }

        private async Task<bool> SendConfirmEmailAsync(User user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var url =
                $"{_config["JWT:ClientUrl"]}/{_config["Email:ConfirmationEmailPath"]}?token={token}&email={user.Email}";

            var body =
                $"<p>Hello {user.FirstName} {user.LastName}</p>"
                + "<p>Please confirm your email by clicking on the following link.</p>"
                + $"<p><a href=\"{url}\">Confirm Email</a></p>"
                + "<p>Thank you</p>"
                + $"<br>{_config["Email:ApplicationName"]}</p>";

            var emailSend = new EmailSendDto(user.Email, "Confirm your email", body);

            return await _emailService.SendEmailAsync(emailSend);
        }

        private async Task<bool> SendForgotUsernameOrPasswordEmail(User user)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var url =
                $"{_config["JWT:ClientUrl"]}/{_config["Email:ResetPasswordPath"]}?token={token}&email={user.Email}";

            var body =
                $"<p>Hello {user.FirstName} {user.LastName}</p>"
                + $"<p>Username: {user.UserName}</p>"
                + "<p>In order to reset your password, please click on the following link.</p>"
                + $"<p><a href=\"{url}\">Reset password</a></p>"
                + "<p>Thank you</p>"
                + $"<br>{_config["Email:ApplicationName"]}</p>";

            var emailSend = new EmailSendDto(user.Email, "Reset password", body);

            return await _emailService.SendEmailAsync(emailSend);
        }

        #endregion
    }
}
