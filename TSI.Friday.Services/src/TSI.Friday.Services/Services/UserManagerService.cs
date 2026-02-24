using System.Text;
using AutoMapper;
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
        private readonly IMapper _mapper;

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
            IMapper mapper,
            IRepository<User> repository
        )
        {
            _jwtService = jwtService;
            _signInManager = signInManager;
            _userManager = userManager;
            _emailService = emailService;
            _config = config;
            _mapper = mapper;
            _repository = repository;
        }

        /// <inheritdoc />
        public async Task<ActionResult<UserDto>> Login(LoginDto model)
        {
            var user = await _userManager.FindByNameAsync(model.UserName);

            if (user == null)
            {
                return Unauthorized("Usuário ou senha inválidos.");
            }

            if (user.EmailConfirmed == false)
            {
                return Unauthorized("Por favor, confirme o seu e-mail.");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);
            if (!result.Succeeded)
            {
                return Unauthorized("Usuário ou senha inválidos.");
            }

            return await CreateApplicationUserDto(user);
        }

        /// <inheritdoc />
        public async Task<ActionResult<UserDto>> RefreshUserToken(string userName)
        {
            var user = await _userManager.FindByNameAsync(userName);

            if (user == null)
            {
                return Unauthorized("Usuário não encontrado.");
            }

            return await CreateApplicationUserDto(user);
        }

        /// <inheritdoc />
        public async Task<ActionResult<WebApiResponse<User>>> Register(RegisterDto model)
        {
            if (await CheckEmailExistisAsync(model.Email))
            {
                return BadRequest(
                    $"Outra conta já está usando o endereço de e-mail {model.Email}. Por favor, tente outro endereço de e-mail."
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
                        Message = "Usuário cadastrado com sucesso.",
                    }
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Não foi possível enviar o e-mail. Por favor, entre em contato com o administrador. Erro: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ConfirmEmail(ConfirmEmailDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized("Este endereço de e-mail não foi cadastrado ainda.");
            }

            if (user.EmailConfirmed)
            {
                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "E-mail confirmado",
                            message = "Seu e-mail foi confirmado com sucesso. Você pode efetuar o login.",
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
                    throw new Exception("Token inválido. Por favor, tente novamente.");
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "E-mail confirmado",
                            message = "Seu e-mail foi confirmado com sucesso. Você pode efetuar o login.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Não foi possível confirmar o e-mail. Por favor, entre em contato com o administrador. Erro: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ResendEmailConfirmation(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("E-mail inválido.");
            }

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Unauthorized("Este endereço de e-mail ainda não foi cadastrado.");
            }

            if (user.EmailConfirmed)
            {
                return BadRequest(
                    "Seu endereço de e-mail foi já foi confirmado. Por favor, efetue o login na sua conta."
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
                            title = "Link de confirmação enviado.",
                            message = "Por favor, confirme seu endereço de e-mail.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Não foi possível enviar o e-mail. Por favor, entre em contato com o administrador. Erro: {ex.Message}"

                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ForgotUsernameOrPassword(string email)
        {
            if (string.IsNullOrEmpty(email))
            {
                return BadRequest("E-mail inválido.");
            }

            var user = await _userManager.FindByEmailAsync(email);

            if (user == null)
            {
                return Unauthorized("Este endereço de e-mail não foi cadastrado ainda.");
            }

            if (!user.EmailConfirmed)
            {
                return BadRequest("Por favor, confirme seu endereço de e-mail primeiro.");
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
                            title = "E-mail de redefinição foi enviado.",
                            message = "Por favor, confira a sua caixa de entrada.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Não foi possível enviar o e-mail. Por favor, entre em contato com o administrador. Erro: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<IActionResult> ResetPassword(ResetPasswordDto model)
        {
            var user = await _userManager.FindByEmailAsync(model.Email);

            if (user == null)
            {
                return Unauthorized("Este endereço de e-mail ainda não foi cadastrado.");
            }

            if (!user.EmailConfirmed)
            {
                return BadRequest("Por favor, confirme seu endereço de e-mail primeiro.");
            }

            try
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var decodedTokenBytes = WebEncoders.Base64UrlDecode(token);
                var decodedToken = Encoding.UTF8.GetString(decodedTokenBytes);

                var result = await _userManager.ResetPasswordAsync(
                    user,
                    decodedToken,
                    model.NewPassword
                );

                if (!result.Succeeded)
                {
                    throw new Exception("Token inválido. Por favor, tente novamente.");
                }

                return Ok(
                    new JsonResult(
                        new
                        {
                            title = "Redefinição concluída.",
                            message = "Sua senha foi redefinida com sucesso.",
                        }
                    )
                );
            }
            catch (Exception ex)
            {
                return BadRequest(
                    $"Erro ao redefinir a senha. Por favor, entre em contato com o administrador. Erro: {ex.Message}"
                );
            }
        }

        /// <inheritdoc />
        public async Task<WebApiResponse<UserDto>> Update(User user)
        {
            WebApiResponse<UserDto> result = new();

            try
            {
                if (string.IsNullOrEmpty(user.Email))
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = "E-mail inválido";
                    return result;
                }

                var userDuplicatedMessage = await _repository.AnyAsync(_ =>
                    _.Id != user.Id && _.Email == user.Email.ToLower()
                );

                if (userDuplicatedMessage)
                {
                    result.Status = ResponseStatus.Error;
                    result.Message = "Já existe um usuário cadastrado com o e-mail informado";
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
                            var addRoleResult = await _userManager.AddToRoleAsync(
                                userToUpdate,
                                user.Role
                            );
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

                result.Data = await CreateApplicationUserDto(userToUpdate, false);
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
        public async Task<WebApiResponse<UserDto>> Remove(User user)
        {
            WebApiResponse<UserDto> result = new();

            try
            {
                // Fetch the user with roles before removal
                var userToRemove = await _userManager.FindByIdAsync(user.Id);
                if (userToRemove == null)
                {
                    return new WebApiResponse<UserDto>
                    {
                        Status = ResponseStatus.Error,
                        Message = "Usuário não encontrado.",
                    };
                }

                await _repository.RemoveAsync(userToRemove);

                result.Data = await CreateApplicationUserDto(userToRemove, false);
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
        public async Task<WebApiResponse<IEnumerable<UserDto>>> FindAll()
        {
            WebApiResponse<IEnumerable<UserDto>> result = new();

            try
            {
                var users = await _repository.GetAllAsync();

                // Use a loop to create DTOs for each user to include role information
                var userDtos = new List<UserDto>();
                foreach (var user in users)
                {
                    var userDto = await CreateApplicationUserDto(user, false);
                    userDtos.Add(userDto);
                }
                result.Data = userDtos;
                result.Status = ResponseStatus.Success;
                result.Message =
                    $"{(result.Data as ICollection<UserDto>)?.Count ?? 0} registro(s) encontrado(s).";
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
        public async Task<WebApiResponse<UserDto>> FindById(string id)
        {
            WebApiResponse<UserDto> result = new();

            try
            {
                var user = await _repository.GetByIdAsync(id);
                result.Data = await CreateApplicationUserDto(user, false);
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
                    $"Não foi possível acessar os registros de usuários na base de dados. Erro: {ex.Message}";
            }

            return result;
        }

        #endregion

        #region Private Helper Methods

        private async Task<UserDto> CreateApplicationUserDto(User user, bool includeJwt = true)
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
                JWT = includeJwt ? _jwtService.CreateJWT(user, roles) : null,
                Photo = user.Photo,
                Role = roles.FirstOrDefault(),
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
                $"<p>Olá {user.FirstName} {user.LastName}</p>"
                + "<p>Por favor, confirme seu e-mail ao clicar no seguinte link.</p>"
                + $"<p><a href=\"{url}\">Confirmar e-mail</a></p>"
                + "<p>Obrigado</p>"
                + $"<br>{_config["Email:ApplicationName"]}</p>";

            var emailSend = new EmailSendDto(user.Email, "Confirme o seu e-mail", body);

            return await _emailService.SendEmailAsync(emailSend);
        }

        private async Task<bool> SendForgotUsernameOrPasswordEmail(User user)
        {
            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            token = WebEncoders.Base64UrlEncode(Encoding.UTF8.GetBytes(token));
            var url =
                $"{_config["JWT:ClientUrl"]}/{_config["Email:ResetPasswordPath"]}?token={token}&email={user.Email}";

            var body =
                $"<p>Olá {user.FirstName} {user.LastName}</p>"
                + $"<p>Usuário: {user.UserName}</p>"
                + "<p>Para redefinir a sua senha, por favor, clique no seguinte link.</p>"
                + $"<p><a href=\"{url}\">Redefinir senha</a></p>"
                + "<p>Obrigado</p>"
                + $"<br>{_config["Email:ApplicationName"]}</p>";

            var emailSend = new EmailSendDto(user.Email, "Redefinir senha", body);

            return await _emailService.SendEmailAsync(emailSend);
        }

        #endregion
    }
}
