using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IIndividualService
    {
        /// <summary>
        /// Add a new Individual based on the object received.
        /// </summary>
        /// <param name="clientDto">The client dto object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Add(ClientDto clientDto);

        /// <summary>
        /// Update a Individual based on the object received.
        /// </summary>
        /// <param name="clientDto">The client dto object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Update(ClientDto clientDto);

        /// <summary>
        /// Should find a Individual that based on the SocialSecurityCard received as parameter.
        /// </summary>
        /// <param name="socialSecurityCard">The SocialSecurityCard to be used on the search.</param>
        /// <returns>One Individual object according to the SocialSecurityCard defined as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindBySocialSecurityCard(string socialSecurityCard);
    }
}
