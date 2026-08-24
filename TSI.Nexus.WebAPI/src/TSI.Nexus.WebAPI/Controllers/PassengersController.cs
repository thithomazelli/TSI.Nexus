using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PassengersController : Controller
    {
        private readonly IPassengerService _passengerService;

        public PassengersController(IPassengerService passengerService)
        {
            _passengerService = passengerService;
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(Passenger passenger)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _passengerService.Add(passenger);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Imports a batch of passengers at once (used by the passenger list import screen).
        /// </summary>
        [HttpPost]
        [Route("AddRange")]
        public async Task<IActionResult> AddRange(IEnumerable<Passenger> passengers)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _passengerService.AddRange(passengers);
            return Ok(webApiResponse);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] Passenger passenger)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _passengerService.Update(passenger);
            return Ok(webApiResponse);
        }

        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] Passenger passenger)
        {
            var webApiResponse = await _passengerService.Remove(passenger);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{passengerId}")]
        public async Task<IActionResult> GetById(Guid? passengerId)
        {
            var webApiResponse = await _passengerService.FindById(passengerId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByTrip/{tripId}")]
        public async Task<IActionResult> GetByTrip(Guid tripId)
        {
            var webApiResponse = await _passengerService.FindByTrip(tripId);
            return Ok(webApiResponse);
        }
    }
}
