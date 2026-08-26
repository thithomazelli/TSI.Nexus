using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Moq;
using TSI.Nexus.Services;

namespace TSI.Nexus.Services.Tests.Services
{
    public class CurrentUserServiceTests
    {
        private readonly Mock<IHttpContextAccessor> _httpContextAccessorMock;
        private readonly CurrentUserService _service;

        public CurrentUserServiceTests()
        {
            _httpContextAccessorMock = new Mock<IHttpContextAccessor>();
            _service = new CurrentUserService(_httpContextAccessorMock.Object);
        }

        private void SetUser(ClaimsPrincipal principal)
        {
            var httpContext = new DefaultHttpContext { User = principal };
            _httpContextAccessorMock.Setup(a => a.HttpContext).Returns(httpContext);
        }

        [Fact]
        public void GetUserId_ShouldReturnNameIdentifierClaim_WhenPresent()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.NameIdentifier, " user-1 ") })
            );
            SetUser(principal);

            var result = _service.GetUserId();

            Assert.Equal("user-1", result);
        }

        [Fact]
        public void GetUserId_ShouldFallBackToSubClaim_WhenNameIdentifierMissing()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim("sub", "user-2") })
            );
            SetUser(principal);

            Assert.Equal("user-2", _service.GetUserId());
        }

        [Fact]
        public void GetUserId_ShouldFallBackToIdClaim_WhenNameIdentifierAndSubMissing()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim("id", "user-3") })
            );
            SetUser(principal);

            Assert.Equal("user-3", _service.GetUserId());
        }

        [Fact]
        public void GetUserId_ShouldFallBackToSidClaim_WhenNoOtherIdClaimPresent()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Sid, "user-4") })
            );
            SetUser(principal);

            Assert.Equal("user-4", _service.GetUserId());
        }

        [Fact]
        public void GetUserId_ShouldReturnNull_WhenHttpContextIsNull()
        {
            _httpContextAccessorMock.Setup(a => a.HttpContext).Returns((HttpContext)null!);

            Assert.Null(_service.GetUserId());
        }

        [Fact]
        public void GetUserId_ShouldReturnNull_WhenNoIdClaimPresent()
        {
            SetUser(new ClaimsPrincipal(new ClaimsIdentity()));

            Assert.Null(_service.GetUserId());
        }

        [Fact]
        public void GetUserName_ShouldReturnNameClaim_WhenPresent()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, " Jane Doe ") })
            );
            SetUser(principal);

            Assert.Equal("Jane Doe", _service.GetUserName());
        }

        [Fact]
        public void GetUserName_ShouldFallBackToNameClaimType_WhenClaimTypesNameMissing()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim("name", "Jane") })
            );
            SetUser(principal);

            Assert.Equal("Jane", _service.GetUserName());
        }

        [Fact]
        public void GetUserName_ShouldFallBackToPreferredUsername_WhenOtherClaimsMissing()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim("preferred_username", "jane.doe") })
            );
            SetUser(principal);

            Assert.Equal("jane.doe", _service.GetUserName());
        }

        [Fact]
        public void GetUserName_ShouldFallBackToUpnClaim_WhenNoOtherNameClaimPresent()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Upn, "jane@example.com") })
            );
            SetUser(principal);

            Assert.Equal("jane@example.com", _service.GetUserName());
        }

        [Fact]
        public void GetUserName_ShouldReturnNull_WhenHttpContextIsNull()
        {
            _httpContextAccessorMock.Setup(a => a.HttpContext).Returns((HttpContext)null!);

            Assert.Null(_service.GetUserName());
        }

        [Fact]
        public void GetUserName_ShouldReturnNull_WhenNoNameClaimPresent()
        {
            SetUser(new ClaimsPrincipal(new ClaimsIdentity()));

            Assert.Null(_service.GetUserName());
        }

        [Fact]
        public void IsInRole_ShouldReturnTrue_WhenUserHasRole()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Master") })
            );
            SetUser(principal);

            Assert.True(_service.IsInRole("Master"));
        }

        [Fact]
        public void IsInRole_ShouldReturnFalse_WhenUserDoesNotHaveRole()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Master") })
            );
            SetUser(principal);

            Assert.False(_service.IsInRole("Administrator"));
        }

        [Fact]
        public void IsInRole_ShouldReturnFalse_WhenRoleIsNullOrWhiteSpace()
        {
            var principal = new ClaimsPrincipal(
                new ClaimsIdentity(new[] { new Claim(ClaimTypes.Role, "Master") })
            );
            SetUser(principal);

            Assert.False(_service.IsInRole("  "));
        }

        [Fact]
        public void IsInRole_ShouldReturnFalse_WhenHttpContextIsNull()
        {
            _httpContextAccessorMock.Setup(a => a.HttpContext).Returns((HttpContext)null!);

            Assert.False(_service.IsInRole("Master"));
        }
    }
}
