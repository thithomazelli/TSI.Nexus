using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TripDriversController : Controller
    {
        private readonly ITripDriverService _tripDriverService;

        public TripDriversController(ITripDriverService tripDriverService)
        {
            _tripDriverService = tripDriverService;
        }

        /// <summary>
        /// Add tripDriver on database
        /// </summary>
        /// <param name="tripDriverDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] TripDriverDto tripDriverDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _tripDriverService.Add(tripDriverDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update tripDriver available on database
        /// </summary>
        /// <param name="tripDriverDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] TripDriverDto tripDriverDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _tripDriverService.Update(tripDriverDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove tripDriver when it is identified on database
        /// </summary>
        /// <param name="tripDriverDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] TripDriverDto tripDriverDto)
        {
            var webApiResponse = await _tripDriverService.Remove(tripDriverDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get trip drivers by trip id
        /// </summary>
        /// <param name="tripId">Trip id to be used in the search</param>
        [HttpGet]
        [Route("GetByTripId/{tripId}")]
        public async Task<IActionResult> GetByTripId(Guid? tripId)
        {
            var webApiResponse = await _tripDriverService.FindByTripId(tripId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get trip drivers by driver id
        /// </summary>
        /// <param name="driverId">Driver id to be used in the search</param>
        [HttpGet]
        [Route("GetByDriverId/{driverId}")]
        public async Task<IActionResult> GetByDriverId(Guid? driverId)
        {
            var webApiResponse = await _tripDriverService.FindByDriverId(driverId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get trip driver by id
        /// </summary>
        /// <param name="tripDriverId">TripDriver id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{tripDriverId}")]
        public async Task<IActionResult> GetById(Guid? tripDriverId)
        {
            var webApiResponse = await _tripDriverService.FindById(tripDriverId);
            return Ok(webApiResponse);
        }
    }
}
