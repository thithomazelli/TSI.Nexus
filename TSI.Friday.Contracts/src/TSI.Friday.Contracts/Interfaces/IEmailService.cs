using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IEmailService
    {
        Task<bool> SendEmailAsync(EmailSendDto emailSend);
    }
}
