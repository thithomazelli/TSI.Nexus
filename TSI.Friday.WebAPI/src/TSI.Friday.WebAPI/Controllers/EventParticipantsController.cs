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
    public class EventParticipantsController : Controller
    {
        /// <summary>
        /// EventParticipantService object created to access the service model.
        /// </summary>
        private readonly IEventParticipantService _eventParticipantService;

        /// <summary>
        /// EventParticipantsController constructor create to initialize the
        /// "_eventParticipantService" using Dependency Injection.
        /// </summary>
        /// <param name="eventParticipantService">IEventParticipantService object used to initialize the internal variable using Dependency Injection.</param>
        public EventParticipantsController(IEventParticipantService eventParticipantService)
        {
            _eventParticipantService = eventParticipantService;
        }

        /// <summary>
        /// Add eventParticipant on database
        /// </summary>
        /// <param name="eventParticipantDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] EventParticipantDto eventParticipantDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _eventParticipantService.Add(eventParticipantDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove eventParticipant when it is identified on database
        /// </summary>
        /// <param name="eventParticipantDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove(
            [FromBody] EventParticipantDto eventParticipantDto
        )
        {
            var webApiResponse = await _eventParticipantService.Remove(eventParticipantDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get event participants by event id
        /// </summary>
        /// <param name="eventId">Event id to be used in the search</param>
        [HttpGet]
        [Route("GetByEventId/{eventId}")]
        public async Task<IActionResult> GetByEventId(Guid? eventId)
        {
            var webApiResponse = await _eventParticipantService.FindByEventId(eventId);
            return Ok(webApiResponse);
        }
    }
}
