using System.Collections.Generic;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ICompanyService
    {
        /// <summary>
        /// Add a new Company based on the object received.
        /// </summary>
        /// <param name="company">The company object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Company> Add(Company company);

        /// <summary>
        /// Update a Company based on the object received.
        /// </summary>
        /// <param name="company">The company object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Company> Update(Company company);

        /// <summary>
        /// Remove a Company based on the object received.
        /// </summary>
        /// <param name="company">The company object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Company> Remove(Company company);

        /// <summary>
        /// Method responsible to get all registers available on The company data table.
        /// </summary>
        /// <returns>All registers found on The company data table.</returns>
        public WebApiResponse<IEnumerable<Company>> FindAll();

        /// <summary>
        /// Method responsible to get only one Company based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Company object according to the ID defined as parameter.</returns>
        public WebApiResponse<Company> FindById(int? id);

        /// <summary>
        /// Should find a Company that based on the NationalRegistry received as parameter.
        /// </summary>
        /// <param name="nationalRegistry">The NationalRegistry to be used on the search.</param>
        /// <returns>One Company object according to the SocialSecurityCard defined as parameter.</returns>
        public WebApiResponse<Company> FindByNationalRegistry(string nationalRegistry);

        /// <summary>
        /// Should find a list of people based on the email received as parameter.
        /// </summary>
        /// <param name="email">The Email to be used on the search.</param>
        /// <returns>A list of people that has the Email equal to the one that was received as parameter.</returns>
        public WebApiResponse<IEnumerable<Company>> FindByEmail(string email);
    }
}
