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
    public class IndividualsController : Controller
    {
        /// <summary>
        /// IndividualService object created to access the service model.
        /// </summary>
        private readonly IIndividualService _individualService;

        /// <summary>
        /// IndividualsController constructor create to initialize the "_individualService" using Dependency Injection.
        /// </summary>
        /// <param name="individualService ">IIndividualService object used to initialize the internal variable using Dependency Injection.</param>
        public IndividualsController(IIndividualService individualService)
        {
            _individualService = individualService;
        }

        /// <summary>
        /// Add individual on database
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

            var webApiResponse = await _individualService.Add(businessPartnerDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update individual available on database
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

            var webApiResponse = await _individualService.Update(businessPartnerDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by socialSecurityCard
        /// </summary>
        /// <param name="socialSecurityCard">SocialSecurityCard to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetBySocialSecurityCard/{socialSecurityCard}")]
        public async Task<IActionResult> GetBySocialSecurityCard(string socialSecurityCard)
        {
            var webApiResponse = await _individualService.FindBySocialSecurityCard(
                socialSecurityCard
            );
            return Ok(webApiResponse);
        }
    }
}
