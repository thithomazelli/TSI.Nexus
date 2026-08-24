using Mailjet.Client;
using Mailjet.Client.TransactionalEmails;
using Microsoft.Extensions.Configuration;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Services
{
    public class EmailService : IEmailService
    {
        private IConfiguration _config { get; }

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        /// <inheritdoc />
        public async Task<bool> SendEmailAsync(EmailSendDto emailSend)
        {
            MailjetClient client = new(_config["Mailjet:ApiKey"], _config["Mailjet:SecretKey"]);

            var email = new TransactionalEmailBuilder()
                .WithFrom(new SendContact(_config["Email:From"], _config["Email:ApplicationName"]))
                .WithSubject(emailSend.Subject)
                .WithHtmlPart(emailSend.Body)
                .WithTo(new SendContact(emailSend.To))
                .Build();

            var response = await client.SendTransactionalEmailAsync(email);

            return response.Messages?.FirstOrDefault()?.Status == "success";
        }
    }
}
