using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class IndividualController : Controller
    {
        /// <summary>
        /// IndividualService object created to access the service model.
        /// </summary>
        private readonly IIndividualService _individualService;

        /// <summary>
        /// IndividualsController constructor create to initialize the "_individualService" using Dependency Injection.
        /// </summary>
        /// <param name="individualService ">IIndividualService object used to initialize the internal variable using Dependency Injection.</param>
        public IndividualController(IIndividualService individualService)
        {
            _individualService = individualService;
        }

        /// <summary>
        /// Add individual on database
        /// </summary>
        /// <param name="individual">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public IActionResult Add([FromBody] Individual individual)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _individualService.Add(individual);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update individual available on database
        /// </summary>
        /// <param name="individual">Object to be updated</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Update")]
        public IActionResult Update([FromBody] Individual individual)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _individualService.Update(individual);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove individual when it is identified on database
        /// </summary>
        /// <param name="individual">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public IActionResult Remove([FromBody] Individual individual)
        {
            var webApiResponse = _individualService.Remove(individual);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all individuals available on database (created only for the initial tests)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public IActionResult GetAll()
        {
            var webApiResponse = _individualService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by id
        /// </summary>
        /// <param name="individualId">Individual id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]

        [Route("GetById/{individualId}")]
        public IActionResult GetById(int? individualId)
        {
            var webApiResponse = _individualService.FindById(individualId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by email
        /// </summary>
        /// <param name="email">Email to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetByEmail/{email}")]
        public IActionResult GetByEmail(string email)
        {
            var webApiResponse = _individualService.FindByEmail(email);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get individual by socialSecurityCard
        /// </summary>
        /// <param name="socialSecurityCard">SocialSecurityCard to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetBySocialSecurityCard/{socialSecurityCard}")]
        public IActionResult GetBySocialSecurityCard(string socialSecurityCard)
        {
            var webApiResponse = _individualService.FindBySocialSecurityCard(socialSecurityCard);
            return Ok(webApiResponse);
        }
    }
}
