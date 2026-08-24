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
    public class ServiceOrdersController : Controller
    {
        private readonly IServiceOrderService _serviceOrderService;

        public ServiceOrdersController(IServiceOrderService serviceOrderService)
        {
            _serviceOrderService = serviceOrderService;
        }

        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(ServiceOrder serviceOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _serviceOrderService.Add(serviceOrder);
            return Ok(webApiResponse);
        }

        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] ServiceOrder serviceOrder)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _serviceOrderService.Update(serviceOrder);
            return Ok(webApiResponse);
        }

        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] ServiceOrder serviceOrder)
        {
            var webApiResponse = await _serviceOrderService.Remove(serviceOrder);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetById/{serviceOrderId}")]
        public async Task<IActionResult> GetById(Guid? serviceOrderId)
        {
            var webApiResponse = await _serviceOrderService.FindById(serviceOrderId);
            return Ok(webApiResponse);
        }

        [HttpGet]
        [Route("GetByDriver/{driverId}")]
        public async Task<IActionResult> GetByDriver(Guid driverId)
        {
            var webApiResponse = await _serviceOrderService.FindByDriver(driverId);
            return Ok(webApiResponse);
        }
    }
}
