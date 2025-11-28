using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Contracts.Interfaces
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
