using System.Collections.Generic;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IIndividualService
    {
        /// <summary>
        /// Add a new Individual based on the object received.
        /// </summary>
        /// <param name="individual">The individual object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Individual> Add(Individual individual);

        /// <summary>
        /// Update a Individual based on the object received.
        /// </summary>
        /// <param name="individual">The individual object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Individual> Update(Individual individual);

        /// <summary>
        /// Remove a Individual based on the object received.
        /// </summary>
        /// <param name="individual">The individual object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Individual> Remove(Individual individual);

        /// <summary>
        /// Method responsible to get all registers available on The individual data table.
        /// </summary>
        /// <returns>All registers found on The individual data table.</returns>
        public WebApiResponse<IEnumerable<Individual>> FindAll();

        /// <summary>
        /// Method responsible to get only one Individual based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Individual object according to the ID defined as parameter.</returns>
        public WebApiResponse<Individual> FindById(int? id);

        /// <summary>
        /// Should find a Individual that based on the SocialSecurityCard received as parameter.
        /// </summary>
        /// <param name="socialSecurityCard">The SocialSecurityCard to be used on the search.</param>
        /// <returns>One Individual object according to the SocialSecurityCard defined as parameter.</returns>
        public WebApiResponse<Individual> FindBySocialSecurityCard(string socialSecurityCard);

        /// <summary>
        /// Should find a list of people based on the email received as parameter.
        /// </summary>
        /// <param name="email">The Email to be used on the search.</param>
        /// <returns>A list of people that has the Email equal to the one that was received as parameter.</returns>
        public WebApiResponse<IEnumerable<Individual>> FindByEmail(string email);
    }
}
