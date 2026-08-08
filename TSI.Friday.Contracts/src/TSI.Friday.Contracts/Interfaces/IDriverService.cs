using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IDriverService
    {
        /// <summary>
        /// Add a new Driver based on the object received.
        /// </summary>
        /// <param name="driver">The driver object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<Driver>> Add(Driver driver);

        /// <summary>
        /// Update a Driver based on the object received.
        /// </summary>
        /// <param name="driver">The driver object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<Driver>> Update(Driver driver);

        /// <summary>
        /// Remove a Driver based on the object received.
        /// </summary>
        /// <param name="driver">The driver object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<Driver>> Remove(Driver driver);

        /// <summary>
        /// Method responsible to get all registers available on the Driver database.
        /// </summary>
        /// <returns>All registers found on the Driver database.</returns>
        Task<WebApiResponse<IEnumerable<Driver>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Driver based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Driver object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<Driver>> FindById(Guid? id);

        /// <summary>
        /// Should find a Driver based on the SocialSecurityCard (CPF) received as parameter.
        /// </summary>
        /// <param name="socialSecurityCard">The CPF to be used on the search.</param>
        /// <returns>One Driver object according to the CPF defined as parameter.</returns>
        Task<WebApiResponse<Driver>> FindBySocialSecurityCard(string socialSecurityCard);

        /// <summary>
        /// Method responsible to get all Drivers that are currently Active and able to be assigned to a trip.
        /// </summary>
        /// <returns>All active Drivers.</returns>
        Task<WebApiResponse<IEnumerable<Driver>>> FindActive();
    }
}
