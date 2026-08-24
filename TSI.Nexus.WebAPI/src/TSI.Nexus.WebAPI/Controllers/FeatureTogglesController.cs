using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class FeatureTogglesController : Controller
    {
        /// <summary>
        /// FeatureToggleService object created to access the service model.
        /// </summary>
        private readonly IFeatureToggleService _featureToggleService;

        /// <summary>
        /// FeatureTogglesController constructor create to initialize the "_featureToggleService" using Dependency Injection.
        /// </summary>
        /// <param name="featureToggleService">IFeatureToggleService object used to initialize the internal variable using Dependency Injection.</param>
        public FeatureTogglesController(IFeatureToggleService featureToggleService)
        {
            _featureToggleService = featureToggleService;
        }

        /// <summary>
        /// Get all feature toggles available on database. Any authenticated user can read the
        /// current state, since the Angular sidebar/guards need it to decide what to show -
        /// only changing it is restricted to Master.
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _featureToggleService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get a feature toggle by key
        /// </summary>
        /// <param name="key">Feature toggle key to be used in the search</param>
        [HttpGet]
        [Route("GetByKey/{key}")]
        public async Task<IActionResult> GetByKey(string key)
        {
            var webApiResponse = await _featureToggleService.FindByKey(key);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Enable or disable a module. Master only.
        /// </summary>
        /// <param name="key">Feature toggle key being changed</param>
        /// <param name="enabled">The new Enabled state</param>
        [HttpPut]
        [Authorize(Policy = "RequireMaster")]
        [Route("SetEnabled/{key}/{enabled}")]
        public async Task<IActionResult> SetEnabled(string key, bool enabled)
        {
            var webApiResponse = await _featureToggleService.SetEnabled(key, enabled);
            return Ok(webApiResponse);
        }
    }
}
