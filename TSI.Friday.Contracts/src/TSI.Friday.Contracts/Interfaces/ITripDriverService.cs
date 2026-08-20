using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ITripDriverService
    {
        /// <summary>
        /// Add a new TripDriver based on the object received. Also creates the matching Outgoing
        /// Payment (expense) on the Trip's Transaction for tripDriverDto.Amount.
        /// </summary>
        Task<WebApiResponse<TripDriverDto>> Add(TripDriverDto tripDriverDto);

        /// <summary>
        /// Update a TripDriver based on the object received. Keeps the linked expense Payment's
        /// amount in sync.
        /// </summary>
        Task<WebApiResponse<TripDriverDto>> Update(TripDriverDto tripDriverDto);

        /// <summary>
        /// Remove a TripDriver based on the object received. Also removes its linked expense
        /// Payment.
        /// </summary>
        Task<WebApiResponse<TripDriverDto>> Remove(TripDriverDto tripDriverDto);

        /// <summary>
        /// Method responsible to get a list of TripDrivers based on the TripId received as parameter.
        /// </summary>
        Task<WebApiResponse<IEnumerable<TripDriverDto>>> FindByTripId(Guid? tripId);

        /// <summary>
        /// Method responsible to get a list of TripDrivers based on the DriverId received as parameter.
        /// </summary>
        Task<WebApiResponse<IEnumerable<TripDriverDto>>> FindByDriverId(Guid? driverId);

        /// <summary>
        /// Method responsible to get only one TripDriver based on the ID received as parameter.
        /// </summary>
        Task<WebApiResponse<TripDriverDto>> FindById(Guid? id);
    }
}
