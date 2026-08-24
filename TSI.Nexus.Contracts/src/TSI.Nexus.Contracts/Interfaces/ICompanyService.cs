using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface ICompanyService
    {
        /// <summary>
        /// Add a new Company based on the object received.
        /// </summary>
        /// <param name="businessPartnerDto">The company object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<BusinessPartnerDto>> Add(BusinessPartnerDto businessPartnerDto);

        /// <summary>
        /// Update a Company based on the object received.
        /// </summary>
        /// <param name="businessPartnerDto">The company object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<BusinessPartnerDto>> Update(BusinessPartnerDto businessPartnerDto);

        /// <summary>
        /// Should find a Company that based on the NationalRegistry received as parameter.
        /// </summary>
        /// <param name="nationalRegistry">The NationalRegistry to be used on the search.</param>
        /// <returns>One Company object according to the SocialSecurityCard defined as parameter.</returns>
        Task<WebApiResponse<BusinessPartnerDto>> FindByNationalRegistry(string nationalRegistry);
    }
}
