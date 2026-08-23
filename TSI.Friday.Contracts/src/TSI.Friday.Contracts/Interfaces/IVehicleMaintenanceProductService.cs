using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IVehicleMaintenanceProductService
    {
        /// <summary>
        /// Add a new VehicleMaintenanceProduct based on the object received.
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">The vehicleMaintenanceProduct object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<VehicleMaintenanceProductDto>> Add(
            VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        );

        /// <summary>
        /// Update a VehicleMaintenanceProduct based on the object received.
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">The vehicleMaintenanceProduct object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<VehicleMaintenanceProductDto>> Update(
            VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        );

        /// <summary>
        /// Remove a VehicleMaintenanceProduct based on the object received.
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">The vehicleMaintenanceProduct object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<VehicleMaintenanceProductDto>> Remove(
            VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        );

        /// <summary>
        /// Method responsible to get all registers available in the vehicle maintenance products database.
        /// </summary>
        /// <returns>All registers found in the vehicle maintenance products database.</returns>
        Task<WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>> FindAll();

        /// <summary>
        /// Method responsible to get a list of VehicleMaintenanceProducts based on the VehicleMaintenanceId received as parameter.
        /// </summary>
        /// <param name="vehicleMaintenanceId">The ID to be used on the search.</param>
        /// <returns>List of vehicleMaintenanceProduct according to the VehicleMaintenanceId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>> FindByVehicleMaintenanceId(
            Guid? vehicleMaintenanceId
        );

        /// <summary>
        /// Method responsible to get a list of VehicleMaintenanceProducts based on the ProductId received as parameter.
        /// </summary>
        /// <param name="productId">The product ID to be used on the search.</param>
        /// <returns>List of vehicleMaintenanceProduct according to the ProductId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<VehicleMaintenanceProductDto>>> FindByProductId(
            Guid? productId
        );

        /// <summary>
        /// Method responsible to get only one VehicleMaintenanceProduct based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One VehicleMaintenanceProduct object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<VehicleMaintenanceProductDto>> FindById(Guid? id);
    }
}
