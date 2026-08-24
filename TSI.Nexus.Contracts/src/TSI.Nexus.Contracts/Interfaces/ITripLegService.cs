using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface ITripLegService
    {
        /// <summary>
        /// Add a new TripLeg based on the object received.
        /// </summary>
        /// <param name="tripLeg">The trip leg object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<TripLeg>> Add(TripLeg tripLeg);

        /// <summary>
        /// Update a TripLeg based on the object received.
        /// </summary>
        /// <param name="tripLeg">The trip leg object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<TripLeg>> Update(TripLeg tripLeg);

        /// <summary>
        /// Remove a TripLeg based on the object received.
        /// </summary>
        /// <param name="tripLeg">The trip leg object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<TripLeg>> Remove(TripLeg tripLeg);

        /// <summary>
        /// Method responsible to get only one TripLeg based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One TripLeg object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<TripLeg>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all TripLegs registered for a given Trip, ordered by SequenceNumber.
        /// </summary>
        /// <param name="tripId">The Trip ID to be used on the search.</param>
        /// <returns>All TripLegs found for the Trip.</returns>
        Task<WebApiResponse<IEnumerable<TripLeg>>> FindByTrip(Guid tripId);
    }
}
