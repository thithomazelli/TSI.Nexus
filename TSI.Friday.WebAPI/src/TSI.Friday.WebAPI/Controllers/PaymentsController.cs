using System;
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
    public class PaymentsController : Controller
    {
        /// <summary>
        /// PaymentService object created to access the service model.
        /// </summary>
        private readonly IPaymentService _paymentService;

        /// <summary>
        /// PaymentsController constructor create to initialize the "_paymentService" using Dependency Injection.
        /// </summary>
        /// <param name="transactionService">IPaymentService object used to initialize the internal variable using Dependency Injection.</param>
        public PaymentsController(IPaymentService transactionService)
        {
            _paymentService = transactionService;
        }

        /// <summary>
        /// Add transaction on database
        /// </summary>
        /// <param name="transactionDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] PaymentDto transactionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentService.Add(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update transaction available on database
        /// </summary>
        /// <param name="transactionDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] PaymentDto transactionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _paymentService.Update(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove transaction when it is identified on database
        /// </summary>
        /// <param name="transactionDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] PaymentDto transactionDto)
        {
            var webApiResponse = await _paymentService.Remove(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all transaction payments available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _paymentService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction payments by id
        /// </summary>
        /// <param name="transactionId">Transaction id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{transactionId}")]
        public async Task<IActionResult> GetById(Guid? transactionId)
        {
            var webApiResponse = await _paymentService.FindById(transactionId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction payments by transaction id
        /// </summary>
        /// <param name="transactionId">Transaction id to be used in the search</param>
        [HttpGet]
        [Route("GetByTransactionId/{transactionId}")]
        public async Task<IActionResult> GetByTransactionId(Guid? transactionId)
        {
            var webApiResponse = await _paymentService.FindByTransactionId(transactionId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction payments by businessPartner id
        /// </summary>
        /// <param name="businessPartnerId">BusinessPartner id to be used in the search</param>
        [HttpGet]
        [Route("GetByBusinessPartnerId/{businessPartnerId}")]
        public async Task<IActionResult> GetByBusinessPartnerId(Guid? businessPartnerId)
        {
            var webApiResponse = await _paymentService.FindByBusinessPartnerId(businessPartnerId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction payments by transaction id
        /// </summary>
        /// <param name="OrderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderId/{orderId}")]
        public async Task<IActionResult> GetByOrderId(Guid? orderId)
        {
            var webApiResponse = await _paymentService.FindByOrderId(orderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction payments by transaction id
        /// </summary>
        /// <param name="OrderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetPaymentsHistory")]
        public async Task<IActionResult> GetPaymentsHistory([FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            var webApiResponse = await _paymentService.GetPaymentsHistory(start, end);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get delayed/overdue payments for notifications
        /// </summary>
        [HttpGet]
        [Route("GetDelayed")]
        public async Task<IActionResult> GetDelayed()
        {
            var webApiResponse = await _paymentService.FindDelayed();
            return Ok(webApiResponse);
        }
    }
}
