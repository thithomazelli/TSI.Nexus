namespace TSI.Friday.Contracts.Interfaces
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
        string? GetUserId();
    }
}
