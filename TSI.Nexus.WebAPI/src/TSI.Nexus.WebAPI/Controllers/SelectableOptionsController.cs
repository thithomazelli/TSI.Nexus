using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class SelectableOptionsController : Controller
    {
        /// <summary>
        /// SelectableOptionService object created to access the service model.
        /// </summary>
        private readonly ISelectableOptionService _selectableOptionService;

        /// <summary>
        /// SelectableOptionsController constructor created to initialize the "_selectableOptionService" using Dependency Injection.
        /// </summary>
        /// <param name="selectableOptionService">ISelectableOptionService object used to initialize the internal variable using Dependency Injection.</param>
        public SelectableOptionsController(ISelectableOptionService selectableOptionService)
        {
            _selectableOptionService = selectableOptionService;
        }

        /// <summary>
        /// Add a selectable option on database
        /// </summary>
        /// <param name="option">Object to be added</param>
        [HttpPost]
        [Authorize(Policy = "RequireAdmin")]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] SelectableOption option)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _selectableOptionService.Add(option);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update a selectable option available on database
        /// </summary>
        /// <param name="option">Object to be updated</param>
        [HttpPut]
        [Authorize(Policy = "RequireAdmin")]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] SelectableOption option)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _selectableOptionService.Update(option);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove a selectable option when it is identified on database
        /// </summary>
        /// <param name="option">Object to be removed</param>
        [HttpDelete]
        [Authorize(Policy = "RequireAdmin")]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] SelectableOption option)
        {
            var webApiResponse = await _selectableOptionService.Remove(option);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all selectable options available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _selectableOptionService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all selectable options for a given group
        /// </summary>
        /// <param name="group">SelectableOptionGroup to be used in the search</param>
        [HttpGet]
        [Route("GetByGroup/{group}")]
        public async Task<IActionResult> GetByGroup(SelectableOptionGroup group)
        {
            var webApiResponse = await _selectableOptionService.FindByGroup(group);
            return Ok(webApiResponse);
        }
    }
}
