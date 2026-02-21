using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IClientService
    {
        /// <summary>
        /// Remove a Client based on the object received.
        /// </summary>
        /// <param name="clientDto">The client DTO object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Remove(ClientDto clientDto);

        /// <summary>
        /// Method responsible to get all registers available on The client data table.
        /// </summary>
        /// <returns>All registers found on The client data table.</returns>
        Task<WebApiResponse<IEnumerable<ClientDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Client based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Client object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindById(int? id);

        /// <summary>
        /// Should find a list of people based on the email received as parameter.
        /// </summary>
        /// <param name="email">The Email to be used on the search.</param>
        /// <returns>A list of people that has the Email equal to the one that was received as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindByEmail(string email);
    }
}
