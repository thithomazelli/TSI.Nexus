using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
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
        /// <param name="clientDto">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] ClientDto clientDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _companyService.Add(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update company available on database
        /// </summary>
        /// <param name="clientDto">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] ClientDto clientDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _companyService.Update(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove company when it is identified on database
        /// </summary>
        /// <param name="clientDto">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] ClientDto clientDto)
        {
            var webApiResponse = await _companyService.Remove(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all companies available on database 
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _companyService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by id
        /// </summary>
        /// <param name="companyId">Company id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]

        [Route("GetById/{companyId}")]
        public async Task<IActionResult> GetById(int? companyId)
        {
            var webApiResponse = await _companyService.FindById(companyId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by email
        /// </summary>
        /// <param name="email">Email to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByEmail/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var webApiResponse = await _companyService.FindByEmail(email);
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
