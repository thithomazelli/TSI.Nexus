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
    public class VehicleMaintenanceProductsController : Controller
    {
        /// <summary>
        /// VehicleMaintenanceProductService object created to access the service model.
        /// </summary>
        private readonly IVehicleMaintenanceProductService _vehicleMaintenanceProductService;

        /// <summary>
        /// VehicleMaintenanceProductsController constructor create to initialize the "_vehicleMaintenanceProductService" using Dependency Injection.
        /// </summary>
        /// <param name="vehicleMaintenanceProductService">IVehicleMaintenanceProductService object used to initialize the internal variable using Dependency Injection.</param>
        public VehicleMaintenanceProductsController(
            IVehicleMaintenanceProductService vehicleMaintenanceProductService
        )
        {
            _vehicleMaintenanceProductService = vehicleMaintenanceProductService;
        }

        /// <summary>
        /// Add vehicleMaintenanceProduct on database
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(
            [FromBody] VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _vehicleMaintenanceProductService.Add(
                vehicleMaintenanceProductDto
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update vehicleMaintenanceProduct available on database
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update(
            [FromBody] VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _vehicleMaintenanceProductService.Update(
                vehicleMaintenanceProductDto
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove vehicleMaintenanceProduct when it is identified on database
        /// </summary>
        /// <param name="vehicleMaintenanceProductDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove(
            [FromBody] VehicleMaintenanceProductDto vehicleMaintenanceProductDto
        )
        {
            var webApiResponse = await _vehicleMaintenanceProductService.Remove(
                vehicleMaintenanceProductDto
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all vehicle maintenance products available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _vehicleMaintenanceProductService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get vehicle maintenance products by vehicle maintenance id
        /// </summary>
        /// <param name="vehicleMaintenanceId">VehicleMaintenance id to be used in the search</param>
        [HttpGet]
        [Route("GetByVehicleMaintenanceId/{vehicleMaintenanceId}")]
        public async Task<IActionResult> GetByVehicleMaintenanceId(Guid? vehicleMaintenanceId)
        {
            var webApiResponse = await _vehicleMaintenanceProductService.FindByVehicleMaintenanceId(
                vehicleMaintenanceId
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get vehicle maintenance products by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        [HttpGet]
        [Route("GetByProductId/{productId}")]
        public async Task<IActionResult> GetByProductId(Guid? productId)
        {
            var webApiResponse = await _vehicleMaintenanceProductService.FindByProductId(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get vehicle maintenance product by id
        /// </summary>
        /// <param name="vehicleMaintenanceProductId">VehicleMaintenanceProduct id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{vehicleMaintenanceProductId}")]
        public async Task<IActionResult> GetById(Guid? vehicleMaintenanceProductId)
        {
            var webApiResponse = await _vehicleMaintenanceProductService.FindById(
                vehicleMaintenanceProductId
            );
            return Ok(webApiResponse);
        }
    }
}
