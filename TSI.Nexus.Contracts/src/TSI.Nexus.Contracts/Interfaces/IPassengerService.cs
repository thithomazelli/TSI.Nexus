using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IPassengerService
    {
        /// <summary>
        /// Add a new Passenger based on the object received.
        /// </summary>
        /// <param name="passenger">The passenger object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<Passenger>> Add(Passenger passenger);

        /// <summary>
        /// Adds a batch of Passengers at once - used by the passenger list import feature (pasted
        /// spreadsheet rows) so the whole list is persisted in a single request.
        /// </summary>
        /// <param name="passengers">The Passenger objects to be added.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<IEnumerable<Passenger>>> AddRange(
            IEnumerable<Passenger> passengers
        );

        /// <summary>
        /// Update a Passenger based on the object received.
        /// </summary>
        /// <param name="passenger">The passenger object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<Passenger>> Update(Passenger passenger);

        /// <summary>
        /// Remove a Passenger based on the object received.
        /// </summary>
        /// <param name="passenger">The passenger object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<Passenger>> Remove(Passenger passenger);

        /// <summary>
        /// Method responsible to get only one Passenger based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Passenger object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<Passenger>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all Passengers registered for a given Trip.
        /// </summary>
        /// <param name="tripId">The Trip ID to be used on the search.</param>
        /// <returns>All Passengers found for the Trip.</returns>
        Task<WebApiResponse<IEnumerable<Passenger>>> FindByTrip(Guid tripId);
    }
}
