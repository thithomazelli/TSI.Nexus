using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IServiceOrderService
    {
        /// <summary>
        /// Add a new ServiceOrder based on the object received.
        /// </summary>
        /// <param name="serviceOrder">The service order object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<ServiceOrder>> Add(ServiceOrder serviceOrder);

        /// <summary>
        /// Update a ServiceOrder based on the object received.
        /// </summary>
        /// <param name="serviceOrder">The service order object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<ServiceOrder>> Update(ServiceOrder serviceOrder);

        /// <summary>
        /// Remove a ServiceOrder based on the object received.
        /// </summary>
        /// <param name="serviceOrder">The service order object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<ServiceOrder>> Remove(ServiceOrder serviceOrder);

        /// <summary>
        /// Method responsible to get only one ServiceOrder based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One ServiceOrder object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<ServiceOrder>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all ServiceOrders registered for a given Driver.
        /// </summary>
        /// <param name="driverId">The Driver ID to be used on the search.</param>
        /// <returns>All ServiceOrders found for the Driver.</returns>
        Task<WebApiResponse<IEnumerable<ServiceOrder>>> FindByDriver(Guid driverId);

        /// <summary>
        /// Automatically creates a ServiceOrder for the given Trip (which must have a Driver
        /// assigned) plus its Commission, calculated from the Driver's CommissionPercentage over
        /// the Trip's TotalPrice. Called when a trip is marked as Closed.
        /// </summary>
        /// <param name="trip">The Trip that was just closed.</param>
        /// <returns>Return an WebApiReponse with the ServiceOrder created for this operation.</returns>
        Task<WebApiResponse<ServiceOrder>> GenerateForTrip(Trip trip);
    }
}
