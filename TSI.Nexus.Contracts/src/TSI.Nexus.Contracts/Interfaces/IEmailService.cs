using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IEmailService
    {
        /// <summary>
        /// 
        /// </summary>
        /// <param name="emailSend"></param>
        /// <returns></returns>
        Task<bool> SendEmailAsync(EmailSendDto emailSend);
    }
}
