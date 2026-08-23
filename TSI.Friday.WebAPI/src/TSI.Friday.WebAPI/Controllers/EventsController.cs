using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EventsController : Controller
    {
        /// <summary>
        /// EventService object created to access the service model.
        /// </summary>
        private readonly IEventService _eventService;

        /// <summary>
        /// EventsController constructor create to initialize the "_eventService" using Dependency Injection.
        /// </summary>
        /// <param name="eventService">IEventService object used to initialize the internal variable using Dependency Injection.</param>
        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        /// <summary>
        /// Add event on database
        /// </summary>
        /// <param name="eventDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] EventDto eventDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _eventService.Add(eventDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update event available on database
        /// </summary>
        /// <param name="eventDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] EventDto eventDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _eventService.Update(eventDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove event when it is identified on database
        /// </summary>
        /// <param name="eventDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] EventDto eventDto)
        {
            var webApiResponse = await _eventService.Remove(eventDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all events available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _eventService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get event by id
        /// </summary>
        /// <param name="eventId">Event id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{eventId}")]
        public async Task<IActionResult> GetById(Guid? eventId)
        {
            var webApiResponse = await _eventService.FindById(eventId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events where the given user is the creator or a participant
        /// </summary>
        /// <param name="userId">User id to be used in the search</param>
        [HttpGet]
        [Route("GetByUserId/{userId}")]
        public async Task<IActionResult> GetByUserId(string userId)
        {
            var webApiResponse = await _eventService.FindByUserId(userId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by business partner id (client/supplier + everything linked to it)
        /// </summary>
        /// <param name="businessPartnerId">BusinessPartner id to be used in the search</param>
        [HttpGet]
        [Route("GetByBusinessPartnerId/{businessPartnerId}")]
        public async Task<IActionResult> GetByBusinessPartnerId(Guid? businessPartnerId)
        {
            var webApiResponse = await _eventService.FindByBusinessPartnerId(businessPartnerId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by quote id
        /// </summary>
        /// <param name="quoteId">Quote id to be used in the search</param>
        [HttpGet]
        [Route("GetByQuoteId/{quoteId}")]
        public async Task<IActionResult> GetByQuoteId(Guid? quoteId)
        {
            var webApiResponse = await _eventService.FindByQuoteId(quoteId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by order id (order + its transaction + its payments)
        /// </summary>
        /// <param name="orderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderId/{orderId}")]
        public async Task<IActionResult> GetByOrderId(Guid? orderId)
        {
            var webApiResponse = await _eventService.FindByOrderId(orderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by purchase order id (purchase order + its transaction + its payments)
        /// </summary>
        /// <param name="purchaseOrderId">PurchaseOrder id to be used in the search</param>
        [HttpGet]
        [Route("GetByPurchaseOrderId/{purchaseOrderId}")]
        public async Task<IActionResult> GetByPurchaseOrderId(Guid? purchaseOrderId)
        {
            var webApiResponse = await _eventService.FindByPurchaseOrderId(purchaseOrderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by trip id (trip + its transaction + its payments)
        /// </summary>
        /// <param name="tripId">Trip id to be used in the search</param>
        [HttpGet]
        [Route("GetByTripId/{tripId}")]
        public async Task<IActionResult> GetByTripId(Guid? tripId)
        {
            var webApiResponse = await _eventService.FindByTripId(tripId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by transaction id (transaction + its payments)
        /// </summary>
        /// <param name="transactionId">Transaction id to be used in the search</param>
        [HttpGet]
        [Route("GetByTransactionId/{transactionId}")]
        public async Task<IActionResult> GetByTransactionId(Guid? transactionId)
        {
            var webApiResponse = await _eventService.FindByTransactionId(transactionId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by payment id
        /// </summary>
        /// <param name="paymentId">Payment id to be used in the search</param>
        [HttpGet]
        [Route("GetByPaymentId/{paymentId}")]
        public async Task<IActionResult> GetByPaymentId(Guid? paymentId)
        {
            var webApiResponse = await _eventService.FindByPaymentId(paymentId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by vehicle id
        /// </summary>
        /// <param name="vehicleId">Vehicle id to be used in the search</param>
        [HttpGet]
        [Route("GetByVehicleId/{vehicleId}")]
        public async Task<IActionResult> GetByVehicleId(Guid? vehicleId)
        {
            var webApiResponse = await _eventService.FindByVehicleId(vehicleId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by driver id
        /// </summary>
        /// <param name="driverId">Driver id to be used in the search</param>
        [HttpGet]
        [Route("GetByDriverId/{driverId}")]
        public async Task<IActionResult> GetByDriverId(Guid? driverId)
        {
            var webApiResponse = await _eventService.FindByDriverId(driverId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by vehicle maintenance id
        /// </summary>
        /// <param name="vehicleMaintenanceId">VehicleMaintenance id to be used in the search</param>
        [HttpGet]
        [Route("GetByVehicleMaintenanceId/{vehicleMaintenanceId}")]
        public async Task<IActionResult> GetByVehicleMaintenanceId(Guid? vehicleMaintenanceId)
        {
            var webApiResponse = await _eventService.FindByVehicleMaintenanceId(
                vehicleMaintenanceId
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get events by fuel log id
        /// </summary>
        /// <param name="fuelLogId">FuelLog id to be used in the search</param>
        [HttpGet]
        [Route("GetByFuelLogId/{fuelLogId}")]
        public async Task<IActionResult> GetByFuelLogId(Guid? fuelLogId)
        {
            var webApiResponse = await _eventService.FindByFuelLogId(fuelLogId);
            return Ok(webApiResponse);
        }
    }
}
