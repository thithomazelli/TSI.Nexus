using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AlertConfigsController : Controller
    {
        private readonly IAlertConfigService _alertConfigService;

        public AlertConfigsController(IAlertConfigService alertConfigService)
        {
            _alertConfigService = alertConfigService;
        }

        /// <summary>
        /// Get all alert configs available on database. Any authenticated user can read the
        /// current state - only changing it is restricted to Master.
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _alertConfigService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Enable or disable an alert. Master only.
        /// </summary>
        [HttpPut]
        [Authorize(Policy = "RequireMaster")]
        [Route("SetEnabled/{key}/{enabled}")]
        public async Task<IActionResult> SetEnabled(string key, bool enabled)
        {
            var webApiResponse = await _alertConfigService.SetEnabled(key, enabled);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Set the lead time (in days) for an alert. Master only.
        /// </summary>
        [HttpPut]
        [Authorize(Policy = "RequireMaster")]
        [Route("SetThresholdDays/{key}/{thresholdDays}")]
        public async Task<IActionResult> SetThresholdDays(string key, int thresholdDays)
        {
            var webApiResponse = await _alertConfigService.SetThresholdDays(key, thresholdDays);
            return Ok(webApiResponse);
        }
    }
}
