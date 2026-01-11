using System.Collections.Generic;
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
        /// Remove a Individual based on the object received.
        /// </summary>
        /// <param name="clientDto">The client dto object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Remove(ClientDto clientDto);

        /// <summary>
        /// Method responsible to get all registers available on The individual data table.
        /// </summary>
        /// <returns>All registers found on The individual data table.</returns>
        Task<WebApiResponse<IEnumerable<ClientDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Individual based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Individual object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindById(int? id);

        /// <summary>
        /// Should find a Individual that based on the SocialSecurityCard received as parameter.
        /// </summary>
        /// <param name="socialSecurityCard">The SocialSecurityCard to be used on the search.</param>
        /// <returns>One Individual object according to the SocialSecurityCard defined as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindBySocialSecurityCard(string socialSecurityCard);

        /// <summary>
        /// Should find a list of people based on the email received as parameter.
        /// </summary>
        /// <param name="email">The Email to be used on the search.</param>
        /// <returns>A list of people that has the Email equal to the one that was received as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindByEmail(string email);
    }
}
