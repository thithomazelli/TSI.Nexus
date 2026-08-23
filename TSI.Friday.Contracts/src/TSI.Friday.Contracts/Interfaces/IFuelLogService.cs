using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IFuelLogService
    {
        /// <summary>
        /// Add a new FuelLog based on the object received.
        /// </summary>
        /// <param name="fuelLog">The fuel log object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<FuelLog>> Add(FuelLog fuelLog);

        /// <summary>
        /// Update a FuelLog based on the object received.
        /// </summary>
        /// <param name="fuelLog">The fuel log object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<FuelLog>> Update(FuelLog fuelLog);

        /// <summary>
        /// Remove a FuelLog based on the object received.
        /// </summary>
        /// <param name="fuelLog">The fuel log object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<FuelLog>> Remove(FuelLog fuelLog);

        /// <summary>
        /// Method responsible to get all registers available on the FuelLog database.
        /// </summary>
        /// <returns>All registers found on the FuelLog database.</returns>
        Task<WebApiResponse<IEnumerable<FuelLog>>> FindAll();

        /// <summary>
        /// Method responsible to get only one FuelLog based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One FuelLog object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<FuelLog>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all fuel log records for a given Vehicle.
        /// </summary>
        /// <param name="vehicleId">The Vehicle ID to be used on the search.</param>
        /// <returns>All fuel log records found for the Vehicle.</returns>
        Task<WebApiResponse<IEnumerable<FuelLog>>> FindByVehicle(Guid vehicleId);
    }
}
