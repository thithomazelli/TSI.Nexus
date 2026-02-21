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
    public class CompaniesController : Controller
    {
        /// <summary>
        /// CompanyService object created to access the service model.
        /// </summary>
        private readonly ICompanyService _companyService;

        /// <summary>
        /// CompanysController constructor create to initialize the "_companyService" using Dependency Injection.
        /// </summary>
        /// <param name="companyService ">ICompanyService object used to initialize the internal variable using Dependency Injection.</param>
        public CompaniesController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        /// <summary>
        /// Add company on database
        /// </summary>
        /// <param name="businessPartnerDto">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] BusinessPartnerDto businessPartnerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _companyService.Add(businessPartnerDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update company available on database
        /// </summary>
        /// <param name="businessPartnerDto">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] BusinessPartnerDto businessPartnerDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _companyService.Update(businessPartnerDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by nationalRegistry
        /// </summary>
        /// <param name="nationalRegistry">NationalRegistry to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByNationalRegistry/{nationalRegistry}")]
        public async Task<IActionResult> GetByNationalRegistry(string nationalRegistry)
        {
            var webApiResponse = await _companyService.FindByNationalRegistry(nationalRegistry);
            return Ok(webApiResponse);
        }
    }
}
