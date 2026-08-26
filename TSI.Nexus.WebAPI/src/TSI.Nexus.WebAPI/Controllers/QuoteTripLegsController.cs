using System;
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
    public class QuoteTripLegsController : Controller
    {
        private readonly IQuoteTripLegService _quoteTripLegService;

        public QuoteTripLegsController(IQuoteTripLegService quoteTripLegService)
        {
            _quoteTripLegService = quoteTripLegService;
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(QuoteTripLeg quoteTripLeg)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _quoteTripLegService.Add(quoteTripLeg);
            return Ok(webApiResponse);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] QuoteTripLeg quoteTripLeg)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _quoteTripLegService.Update(quoteTripLeg);
            return Ok(webApiResponse);
        }

        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] QuoteTripLeg quoteTripLeg)
        {
            var webApiResponse = await _quoteTripLegService.Remove(quoteTripLeg);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{quoteTripLegId}")]
        public async Task<IActionResult> GetById(Guid? quoteTripLegId)
        {
            var webApiResponse = await _quoteTripLegService.FindById(quoteTripLegId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByQuoteTrip/{quoteTripId}")]
        public async Task<IActionResult> GetByQuoteTrip(Guid quoteTripId)
        {
            var webApiResponse = await _quoteTripLegService.FindByQuoteTrip(quoteTripId);
            return Ok(webApiResponse);
        }
    }
}
