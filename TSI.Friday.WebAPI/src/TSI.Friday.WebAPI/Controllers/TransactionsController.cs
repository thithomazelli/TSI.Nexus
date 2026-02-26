using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class TransactionsController : Controller
    {
        /// <summary>
        /// TransactionService object created to access the service model.
        /// </summary>
        private readonly ITransactionService _transactionService;

        /// <summary>
        /// TransactionsController constructor create to initialize the "_transactionService" using Dependency Injection.
        /// </summary>
        /// <param name="transactionService">ITransactionService object used to initialize the internal variable using Dependency Injection.</param>
        public TransactionsController(ITransactionService transactionService)
        {
            _transactionService = transactionService;
        }

        /// <summary>
        /// Add transaction on database
        /// </summary>
        /// <param name="transactionDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] TransactionDto transactionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _transactionService.Add(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update transaction available on database
        /// </summary>
        /// <param name="transactionDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] TransactionDto transactionDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _transactionService.Update(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove transaction when it is identified on database
        /// </summary>
        /// <param name="transactionDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] TransactionDto transactionDto)
        {
            var webApiResponse = await _transactionService.Remove(transactionDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all transactions available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _transactionService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transaction by id
        /// </summary>
        /// <param name="transactionId">Transaction id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{transactionId}")]
        public async Task<IActionResult> GetById(Guid? transactionId)
        {
            var webApiResponse = await _transactionService.FindById(transactionId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transactions by businessPartner id
        /// </summary>
        /// <param name="businessPartnerId">BusinessPartner id to be used in the search</param>
        [HttpGet]
        [Route("GetByBusinessPartnerId/{businessPartnerId}")]
        public async Task<IActionResult> GetByBusinessPartnerId(Guid? businessPartnerId)
        {
            var webApiResponse = await _transactionService.FindByBusinessPartnerId(businessPartnerId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get transactions grouped by category summing payments for each category
        /// </summary>
        /// <param name="type">TransactionType to filter (optional)</param>
        /// <param name="start">Optional start date (inclusive)</param>
        /// <param name="end">Optional end date (inclusive)</param>
        [HttpGet]
        [Route("GetTransactionsGroupByCategory")]
        public async Task<IActionResult> GetTransactionsGroupByCategory([FromQuery] TransactionType? type = null, [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            var webApiResponse = await _transactionService.GetTransactionsGroupByCategory(type, start, end);
            return Ok(webApiResponse);
        }
    }
}
