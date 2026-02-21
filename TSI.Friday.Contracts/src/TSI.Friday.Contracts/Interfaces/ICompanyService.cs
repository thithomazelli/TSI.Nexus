using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ICompanyService
    {
        /// <summary>
        /// Add a new Company based on the object received.
        /// </summary>
        /// <param name="clientDto">The company object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Add(ClientDto clientDto);

        /// <summary>
        /// Update a Company based on the object received.
        /// </summary>
        /// <param name="clientDto">The company object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ClientDto>> Update(ClientDto clientDto);

        /// <summary>
        /// Should find a Company that based on the NationalRegistry received as parameter.
        /// </summary>
        /// <param name="nationalRegistry">The NationalRegistry to be used on the search.</param>
        /// <returns>One Company object according to the SocialSecurityCard defined as parameter.</returns>
        Task<WebApiResponse<ClientDto>> FindByNationalRegistry(string nationalRegistry);
    }
}
