using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ITripLegService
    {
        Task<WebApiResponse<TripLeg>> Add(TripLeg tripLeg);

        Task<WebApiResponse<TripLeg>> Update(TripLeg tripLeg);

        Task<WebApiResponse<TripLeg>> Remove(TripLeg tripLeg);

        Task<WebApiResponse<TripLeg>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all TripLegs registered for a given Order, ordered by SequenceNumber.
        /// </summary>
        /// <param name="orderId">The Order ID to be used on the search.</param>
        /// <returns>All TripLegs found for the Order.</returns>
        Task<WebApiResponse<IEnumerable<TripLeg>>> FindByOrder(Guid orderId);
    }
}
