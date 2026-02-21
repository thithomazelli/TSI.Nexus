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
    public class ClientsController : Controller
    {
        /// <summary>
        /// ClientService object created to access the service model.
        /// </summary>
        private readonly IClientService _clientService;

        /// <summary>
        /// ClientsController constructor create to initialize the "_clientService" using Dependency Injection.
        /// </summary>
        /// <param name="clientService ">IClientService object used to initialize the internal variable using Dependency Injection.</param>
        public ClientsController(IClientService clientService)
        {
            _clientService = clientService;
        }

        /// <summary>
        /// Remove client when it is identified on database
        /// </summary>
        /// <param name="client">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] ClientDto client)
        {
            var webApiResponse = await _clientService.Remove(client);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all companies available on database
        /// </summary>
        /// <returns>List of all clients from database</returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _clientService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get client by id
        /// </summary>
        /// <param name="clientId">Client id to be used in the search</param>
        /// <returns>The client object based on the id informed</returns>
        [HttpGet]
        [Route("GetById/{clientId}")]
        public async Task<IActionResult> GetById(int? clientId)
        {
            var webApiResponse = await _clientService.FindById(clientId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get client by email
        /// </summary>
        /// <param name="email">Email to be used in the search</param>
        /// <returns>The client object based on the email informed</returns>
        [HttpGet]
        [Route("GetByEmail/{email}")]
        public async Task<IActionResult> GetByEmail(string email)
        {
            var webApiResponse = await _clientService.FindByEmail(email);
            return Ok(webApiResponse);
        }
    }
}
