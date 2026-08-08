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
    public class DriversController : Controller
    {
        /// <summary>
        /// DriverService object created to access the service model.
        /// </summary>
        private readonly IDriverService _driverService;

        /// <summary>
        /// DriversController constructor create to initialize the "_driverService" using Dependency Injection.
        /// </summary>
        /// <param name="driverService">IDriverService object used to initialize the internal variable using Dependency Injection.</param>
        public DriversController(IDriverService driverService)
        {
            _driverService = driverService;
        }

        /// <summary>
        /// Add driver on database
        /// </summary>
        /// <param name="driver">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(Driver driver)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _driverService.Add(driver);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update driver available on database
        /// </summary>
        /// <param name="driver">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] Driver driver)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _driverService.Update(driver);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove driver when it is identified on database
        /// </summary>
        /// <param name="driver">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] Driver driver)
        {
            var webApiResponse = await _driverService.Remove(driver);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all drivers available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _driverService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get driver by id
        /// </summary>
        /// <param name="driverId">Driver id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetById/{driverId}")]
        public async Task<IActionResult> GetById(Guid? driverId)
        {
            var webApiResponse = await _driverService.FindById(driverId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get driver by CPF (social security card)
        /// </summary>
        /// <param name="socialSecurityCard">CPF to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetBySocialSecurityCard/{socialSecurityCard}")]
        public async Task<IActionResult> GetBySocialSecurityCard(string socialSecurityCard)
        {
            var webApiResponse = await _driverService.FindBySocialSecurityCard(socialSecurityCard);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get only drivers currently active and able to be assigned to a trip
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetActive")]
        public async Task<IActionResult> GetActive()
        {
            var webApiResponse = await _driverService.FindActive();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get drivers whose CNH is expired or expiring within the given number of days
        /// (defaults to 60, the lead time recommended in the sector).
        /// </summary>
        [HttpGet]
        [Route("GetExpiringLicenses")]
        public async Task<IActionResult> GetExpiringLicenses([FromQuery] int daysAhead = 60)
        {
            var webApiResponse = await _driverService.FindWithExpiringLicense(daysAhead);
            return Ok(webApiResponse);
        }
    }
}
