using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IEventService
    {
        /// <summary>
        /// Add a new Event based on the object received. Rejects the request when none of the
        /// eleven entity-link fields is set - an Event always has to be linked to something.
        /// </summary>
        /// <param name="eventDto">The event object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<EventDto>> Add(EventDto eventDto);

        /// <summary>
        /// Update an Event based on the object received. Same "at least one link" rule as Add.
        /// </summary>
        /// <param name="eventDto">The event object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<EventDto>> Update(EventDto eventDto);

        /// <summary>
        /// Remove an Event based on the object received.
        /// </summary>
        /// <param name="eventDto">The event object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<EventDto>> Remove(EventDto eventDto);

        /// <summary>
        /// Method responsible to get all registers available in the events database.
        /// </summary>
        /// <returns>All registers found in the events database.</returns>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Event based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Event object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<EventDto>> FindById(Guid? id);

        /// <summary>
        /// Events where the given user is either the creator or a participant - used by the
        /// "meus eventos" filter, the upcoming-events navbar bell, and the Agenda tab on User.
        /// </summary>
        /// <param name="userId">The user ID to be used on the search.</param>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByUserId(string userId);

        /// <summary>Events linked directly to the BusinessPartner, or to any Order/PurchaseOrder/
        /// Quote/Trip/Transaction/Payment that already carries the same BusinessPartnerId.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByBusinessPartnerId(Guid? businessPartnerId);

        /// <summary>Events linked directly to the Quote.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByQuoteId(Guid? quoteId);

        /// <summary>Events linked to the Order, to its Transaction, or to any Payment of that
        /// Transaction/Order.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByOrderId(Guid? orderId);

        /// <summary>Events linked to the PurchaseOrder, to its Transaction, or to any Payment of
        /// that Transaction/PurchaseOrder.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByPurchaseOrderId(Guid? purchaseOrderId);

        /// <summary>Events linked to the Trip, to its Transaction, or to any Payment of that
        /// Transaction/Trip.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByTripId(Guid? tripId);

        /// <summary>Events linked directly to the Transaction, or to any of its Payments.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByTransactionId(Guid? transactionId);

        /// <summary>Events linked directly to the Payment.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByPaymentId(Guid? paymentId);

        /// <summary>Events linked directly to the Vehicle.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByVehicleId(Guid? vehicleId);

        /// <summary>Events linked directly to the Driver.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByDriverId(Guid? driverId);

        /// <summary>Events linked directly to the VehicleMaintenance.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByVehicleMaintenanceId(
            Guid? vehicleMaintenanceId
        );

        /// <summary>Events linked directly to the FuelLog.</summary>
        Task<WebApiResponse<IEnumerable<EventDto>>> FindByFuelLogId(Guid? fuelLogId);
    }
}
