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
    public class QuoteProductsController : Controller
    {
        /// <summary>
        /// QuoteProductService object created to access the service model.
        /// </summary>
        private readonly IQuoteProductService _quoteProductService;

        /// <summary>
        /// QuoteProductsController constructor create to initialize the "_quoteProductService" using Dependency Injection.
        /// </summary>
        /// <param name="quoteProductService">IQuoteProductService object used to initialize the internal variable using Dependency Injection.</param>
        public QuoteProductsController(IQuoteProductService quoteProductService)
        {
            _quoteProductService = quoteProductService;
        }

        /// <summary>
        /// Add quoteProduct on database
        /// </summary>
        /// <param name="quoteProductDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] QuoteProductDto quoteProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _quoteProductService.Add(quoteProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update quoteProduct available on database
        /// </summary>
        /// <param name="quoteProductDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] QuoteProductDto quoteProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _quoteProductService.Update(quoteProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove quoteProduct when it is identified on database
        /// </summary>
        /// <param name="quoteProductDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] QuoteProductDto quoteProductDto)
        {
            var webApiResponse = await _quoteProductService.Remove(quoteProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all quote products available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _quoteProductService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get quote products by quote id
        /// </summary>
        /// <param name="orderId">Quote id to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderId/{orderId}")]
        public async Task<IActionResult> GetByOrderId(Guid? orderId)
        {
            var webApiResponse = await _quoteProductService.FindByOrderId(orderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get quote products by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        [HttpGet]
        [Route("GetByProductId/{productId}")]
        public async Task<IActionResult> GetByProductId(Guid? productId)
        {
            var webApiResponse = await _quoteProductService.FindByProductId(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get quote product by id
        /// </summary>
        /// <param name="quoteProductId">QuoteProduct id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{quoteProductId}")]
        public async Task<IActionResult> GetById(Guid? quoteProductId)
        {
            var webApiResponse = await _quoteProductService.FindById(quoteProductId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get delayed/overdue quote products for notifications
        /// </summary>
        [HttpGet]
        [Route("GetDelayed")]
        public async Task<IActionResult> GetDelayed()
        {
            var webApiResponse = await _quoteProductService.FindDelayed();
            return Ok(webApiResponse);
        }
    }
}
