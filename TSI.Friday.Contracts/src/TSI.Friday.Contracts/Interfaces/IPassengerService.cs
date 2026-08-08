using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPassengerService
    {
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

        Task<WebApiResponse<Passenger>> Update(Passenger passenger);

        Task<WebApiResponse<Passenger>> Remove(Passenger passenger);

        Task<WebApiResponse<Passenger>> FindById(Guid? id);

        Task<WebApiResponse<IEnumerable<Passenger>>> FindByOrder(Guid orderId);
    }
}
