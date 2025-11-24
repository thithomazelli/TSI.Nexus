using System.Collections.Generic;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IAddressService
    {
        /// <summary>
        /// Add a new Address based on the object received.
        /// </summary>
        /// <param name="address">The address object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Address> Add(Address address);

        /// <summary>
        /// Update an Address based on the object received.
        /// </summary>
        /// <param name="address">The address object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Address> Update(Address address);

        /// <summary>
        /// Remove an Address based on the object received.
        /// </summary>
        /// <param name="address">The address object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Address> Remove(Address address);

        /// <summary>
        /// Method responsible to get only one Address based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One address object according to the ID defined as parameter.</returns>
        public WebApiResponse<Address> FindById(int? id);

        /// <summary>
        /// Method responsible to get an list of Addresses based on the PersonID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>List of address according to the PersonID defined as parameter.</returns>
        public WebApiResponse<IEnumerable<Address>> FindByPersonId(int? personId);
    }
}
