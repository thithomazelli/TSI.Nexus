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
    public class CommissionsController : Controller
    {
        private readonly ICommissionService _commissionService;

        public CommissionsController(ICommissionService commissionService)
        {
            _commissionService = commissionService;
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] Commission commission)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _commissionService.Update(commission);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{commissionId}")]
        public async Task<IActionResult> GetById(Guid? commissionId)
        {
            var webApiResponse = await _commissionService.FindById(commissionId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByDriver/{driverId}")]
        public async Task<IActionResult> GetByDriver(Guid driverId)
        {
            var webApiResponse = await _commissionService.FindByDriver(driverId);
            return Ok(webApiResponse);
        }
    }
}
