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
    public class PaymentInstallmentsController : Controller
    {
        /// <summary>
        /// PaymentService object created to access the service model.
        /// </summary>
        private readonly IPaymentInstallmentService _paymentInstallmentService;

        /// <summary>
        /// PaymentInstalmentsController constructor create to initialize the "_paymentInstallmentService" using Dependency Injection.
        /// </summary>
        /// <param name="paymentService">IPaymentInstallmentService object used to initialize the internal variable using Dependency Injection.</param>
        public PaymentInstallmentsController(IPaymentInstallmentService paymentService)
        {
            _paymentInstallmentService = paymentService;
        }

        /// <summary>
        /// Add payment on database
        /// </summary>
        /// <param name="paymentDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] PaymentInstallmentDto paymentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentInstallmentService.Add(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update payment available on database
        /// </summary>
        /// <param name="paymentDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] PaymentInstallmentDto paymentDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentInstallmentService.Update(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove payment when it is identified on database
        /// </summary>
        /// <param name="paymentDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] PaymentInstallmentDto paymentDto)
        {
            var webApiResponse = await _paymentInstallmentService.Remove(paymentDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all payment installments available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _paymentInstallmentService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payment installments by id
        /// </summary>
        /// <param name="paymentId">Payment id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{paymentId}")]
        public async Task<IActionResult> GetById(int? paymentId)
        {
            var webApiResponse = await _paymentInstallmentService.FindById(paymentId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payment installments by payment id
        /// </summary>
        /// <param name="paymentId">Payment id to be used in the search</param>
        [HttpGet]
        [Route("GetByPaymentId/{paymentId}")]
        public async Task<IActionResult> GetByPaymentId(int? paymentId)
        {
            var webApiResponse = await _paymentInstallmentService.FindByPaymentId(paymentId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payment installments by client id
        /// </summary>
        /// <param name="clientId">Client id to be used in the search</param>
        [HttpGet]
        [Route("GetByClientId/{clientId}")]
        public async Task<IActionResult> GetByClientId(int? clientId)
        {
            var webApiResponse = await _paymentInstallmentService.FindByClientId(clientId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get payment installments by payment id
        /// </summary>
        /// <param name="OrderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderId/{orderId}")]
        public async Task<IActionResult> GetByOrderId(int? orderId)
        {
            var webApiResponse = await _paymentInstallmentService.FindByOrderId(orderId);
            return Ok(webApiResponse);
        }
    }
}
