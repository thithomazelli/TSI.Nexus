using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        #region Properties

        private readonly IHttpContextAccessor _httpContextAccessor;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// CurrentUserService constructor created to initialize the "_httpContextAccessor" using Dependency Injection.
        /// </summary>
        /// <param name="httpContextAccessor">The HTTP context accessor.</param>
        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        /// <inheritdoc />
        public string? GetUserId()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return null;

            // Try common claim types that may hold the user identifier
            var idClaim =
                user.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user.FindFirst("sub")?.Value
                ?? user.FindFirst("id")?.Value
                ?? user.FindFirst(ClaimTypes.Sid)?.Value;

            if (string.IsNullOrWhiteSpace(idClaim))
                return null;

            return idClaim.Trim();
        }

        /// <inheritdoc />
        public string? GetUserName()
        {
            var user = _httpContextAccessor.HttpContext?.User;
            if (user == null)
                return null;

            // Try common claim types that may hold the user name
            var name =
                user.FindFirst(ClaimTypes.Name)?.Value
                ?? user.FindFirst("name")?.Value
                ?? user.FindFirst("preferred_username")?.Value
                ?? user.FindFirst(ClaimTypes.Upn)?.Value;

            if (string.IsNullOrWhiteSpace(name))
                return null;

            return name.Trim();
        }

        #endregion Public methods
    }
}
