using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IAddressService
    {
        /// <summary>
        /// Add a new Address based on the object received.
        /// </summary>
        /// <param name="addressDto">The address object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<AddressDto>> Add(AddressDto addressDto);

        /// <summary>
        /// Update an Address based on the object received.
        /// </summary>
        /// <param name="addressDto">The address object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<AddressDto>> Update(AddressDto addressDto);

        /// <summary>
        /// Remove an Address based on the object received.
        /// </summary>
        /// <param name="addressDto">The address object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<AddressDto>> Remove(AddressDto addressDto);

        /// <summary>
        /// Method responsible to get only one Address based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One address object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<AddressDto>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get a list of Addresses based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="businessPartnerId">The BusinessPartnerID to be used on the search.</param>
        /// <returns>List of address according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<AddressDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        );
    }
}
