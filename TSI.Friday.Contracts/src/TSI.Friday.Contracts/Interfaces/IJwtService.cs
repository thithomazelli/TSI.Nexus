using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// 
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        string CreateJWT(User user);
    }
}
