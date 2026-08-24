namespace TSI.Nexus.Contracts.Interfaces
{
    /// <summary>
    /// Abstraction to obtain the current authenticated user information (lightweight, testable).
    /// Implemented in the WebAPI project using IHttpContextAccessor.
    /// </summary>
    public interface ICurrentUserService
    {
        /// <summary>
        /// Returns the current authenticated user's id as string (could be GUID or numeric) if available, otherwise null.
        /// </summary>
        string GetUserId();

        /// <summary>
        /// Returns the current authenticated user's user name if available, otherwise null.
        /// </summary>
        string GetUserName();

        /// <summary>
        /// Returns true when the current authenticated user has the role received as parameter.
        /// </summary>
        bool IsInRole(string role);
    }
}
