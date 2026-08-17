using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TripLegsController : Controller
    {
        private readonly ITripLegService _tripLegService;

        public TripLegsController(ITripLegService tripLegService)
        {
            _tripLegService = tripLegService;
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(TripLeg tripLeg)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _tripLegService.Add(tripLeg);
            return Ok(webApiResponse);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] TripLeg tripLeg)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _tripLegService.Update(tripLeg);
            return Ok(webApiResponse);
        }

        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] TripLeg tripLeg)
        {
            var webApiResponse = await _tripLegService.Remove(tripLeg);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{tripLegId}")]
        public async Task<IActionResult> GetById(Guid? tripLegId)
        {
            var webApiResponse = await _tripLegService.FindById(tripLegId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByTrip/{tripId}")]
        public async Task<IActionResult> GetByTrip(Guid tripId)
        {
            var webApiResponse = await _tripLegService.FindByTrip(tripId);
            return Ok(webApiResponse);
        }
    }
}
