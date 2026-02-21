using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class AddressesController : Controller
    {
        /// <summary>
        /// AddressService object created to access the service model.
        /// </summary>
        private readonly IAddressService _addressService;

        /// <summary>
        /// AddressesController constructor create to initialize the "_addressService" using Dependency Injection.
        /// </summary>
        /// <param name="addressService ">IAddressService object used to initialize the internal variable using Dependency Injection.</param>
        public AddressesController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        /// <summary>
        /// Add address on database
        /// </summary>
        /// <param name="address">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(AddressDto address)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _addressService.Add(address);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update address available on database
        /// </summary>
        /// <param name="address">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] AddressDto address)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _addressService.Update(address);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove address when it is identified on database
        /// </summary>
        /// <param name="address">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] AddressDto address)
        {
            var webApiResponse = await _addressService.Remove(address);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all addresss available on database 
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAllByBusinessPartnerId/{businessPartnerId}")]
        public async Task<IActionResult> GetAllByBusinessPartnerId(int? businessPartnerId)
        {
            var webApiResponse = await _addressService.FindByBusinessPartnerId(businessPartnerId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get address by id
        /// </summary>
        /// <param name="addressId">Address id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetById/{addressId}")]
        public async Task<IActionResult> GetById(int? addressId)
        {
            var webApiResponse = await _addressService.FindById(addressId);
            return Ok(webApiResponse);
        }
    }
}