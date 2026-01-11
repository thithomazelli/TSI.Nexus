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

            var webApiResponse = await _individualService.Add(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update individual available on database
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

            var webApiResponse = await _individualService.Update(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove individual when it is identified on database
        /// </summary>
        /// <param name="clientDto">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] ClientDto clientDto)
        {
            var webApiResponse = await _individualService.Remove(clientDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all individuals available on database 
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _individualService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by id
        /// </summary>
        /// <param name="individualId">Individual id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]

        [Route("GetById/{individualId}")]
        public async Task<IActionResult> GetById(int? individualId)
        {
            var webApiResponse = await _individualService.FindById(individualId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by email
        /// </summary>
        /// <param name="email">Email to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByEmail/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var webApiResponse = await _individualService.FindByEmail(email);
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
            var webApiResponse = await _individualService.FindBySocialSecurityCard(socialSecurityCard);
            return Ok(webApiResponse);
        }
    }
}
