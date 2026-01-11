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
    public class PaymentsController : Controller
    {
        /// <summary>
        /// PaymentService object created to access the service model.
        /// </summary>
        private readonly IPaymentService _paymentService;

        /// <summary>
        /// PaymentsController constructor create to initialize the "_paymentService" using Dependency Injection.
        /// </summary>
        /// <param name="paymentService">IPaymentService object used to initialize the internal variable using Dependency Injection.</param>
        public PaymentsController(IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        /// <summary>
        /// Add payment on database
        /// </summary>
        /// <param name="paymentDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] PaymentDto paymentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentService.Add(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update payment available on database
        /// </summary>
        /// <param name="paymentDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] PaymentDto paymentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentService.Update(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove payment when it is identified on database
        /// </summary>
        /// <param name="paymentDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] PaymentDto paymentDto)
        {
            var webApiResponse = await _paymentService.Remove(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payment by id
        /// </summary>
        /// <param name="paymentId">Payment id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{paymentId}")]
        public async Task<IActionResult> GetById(int? paymentId)
        {
            var webApiResponse = await _paymentService.FindById(paymentId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payments by client id
        /// </summary>
        /// <param name="clientId">Client id to be used in the search</param>
        [HttpGet]
        [Route("GetByClientId/{clientId}")]
        public async Task<IActionResult> GetByClientId(int? clientId)
        {
            var webApiResponse = await _paymentService.FindByClientId(clientId);
            return Ok(webApiResponse);
        }
    }
}