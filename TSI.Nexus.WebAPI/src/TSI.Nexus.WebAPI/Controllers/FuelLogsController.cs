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
    public class FuelLogsController : Controller
    {
        private readonly IFuelLogService _fuelLogService;

        public FuelLogsController(IFuelLogService fuelLogService)
        {
            _fuelLogService = fuelLogService;
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(FuelLog fuelLog)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _fuelLogService.Add(fuelLog);
            return Ok(webApiResponse);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] FuelLog fuelLog)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _fuelLogService.Update(fuelLog);
            return Ok(webApiResponse);
        }

        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] FuelLog fuelLog)
        {
            var webApiResponse = await _fuelLogService.Remove(fuelLog);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _fuelLogService.FindAll();
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{fuelLogId}")]
        public async Task<IActionResult> GetById(Guid? fuelLogId)
        {
            var webApiResponse = await _fuelLogService.FindById(fuelLogId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByVehicle/{vehicleId}")]
        public async Task<IActionResult> GetByVehicle(Guid vehicleId)
        {
            var webApiResponse = await _fuelLogService.FindByVehicle(vehicleId);
            return Ok(webApiResponse);
        }
    }
}
