using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class CompanyController : Controller
    {
        /// <summary>
        /// CompanyService object created to access the service model.
        /// </summary>
        private readonly ICompanyService _companyService;

        /// <summary>
        /// CompanysController constructor create to initialize the "_companyService" using Dependency Injection.
        /// </summary>
        /// <param name="companyService ">ICompanyService object used to initialize the internal variable using Dependency Injection.</param>
        public CompanyController(ICompanyService companyService)
        {
            _companyService = companyService;
        }

        /// <summary>
        /// Add company on database
        /// </summary>
        /// <param name="company">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public IActionResult Add([FromBody] Company company)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _companyService.Add(company);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update company available on database
        /// </summary>
        /// <param name="company">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public IActionResult Update([FromBody] Company company)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _companyService.Update(company);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove company when it is identified on database
        /// </summary>
        /// <param name="company">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public IActionResult Remove([FromBody] Company company)
        {
            var webApiResponse = _companyService.Remove(company);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all companies available on database (created only for the initial tests)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public IActionResult GetAll()
        {
            var webApiResponse = _companyService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by id
        /// </summary>
        /// <param name="companyId">Company id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]

        [Route("GetById/{companyId}")]
        public IActionResult GetById(int? companyId)
        {
            var webApiResponse = _companyService.FindById(companyId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by email
        /// </summary>
        /// <param name="email">Email to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByEmail/{email}")]
        public IActionResult GetByEmail(string email)
        {
            var webApiResponse = _companyService.FindByEmail(email);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get company by nationalRegistry
        /// </summary>
        /// <param name="nationalRegistry">NationalRegistry to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByNationalRegistry/{nationalRegistry}")]
        public IActionResult GetByNationalRegistry(string nationalRegistry)
        {
            var webApiResponse = _companyService.FindByNationalRegistry(nationalRegistry);
            return Ok(webApiResponse);
        }
    }
}
