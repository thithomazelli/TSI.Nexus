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
    public class OrderProductsController : Controller
    {
        /// <summary>
        /// OrderProductService object created to access the service model.
        /// </summary>
        private readonly IOrderProductService _orderProductService;

        /// <summary>
        /// OrderProductsController constructor create to initialize the "_orderProductService" using Dependency Injection.
        /// </summary>
        /// <param name="orderProductService">IOrderProductService object used to initialize the internal variable using Dependency Injection.</param>
        public OrderProductsController(IOrderProductService orderProductService)
        {
            _orderProductService = orderProductService;
        }

        /// <summary>
        /// Add orderProduct on database
        /// </summary>
        /// <param name="orderProductDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] OrderProductDto orderProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _orderProductService.Add(orderProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update orderProduct available on database
        /// </summary>
        /// <param name="orderProductDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] OrderProductDto orderProductDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _orderProductService.Update(orderProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove orderProduct when it is identified on database
        /// </summary>
        /// <param name="orderProductDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] OrderProductDto orderProductDto)
        {
            var webApiResponse = await _orderProductService.Remove(orderProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all orders available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _orderProductService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get order products by order id
        /// </summary>
        /// <param name="orderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderId/{orderId}")]
        public async Task<IActionResult> GetByOrderId(Guid? orderId)
        {
            var webApiResponse = await _orderProductService.FindByOrderId(orderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get order products by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        [HttpGet]
        [Route("GetByProductId/{productId}")]
        public async Task<IActionResult> GetByProductId(Guid? productId)
        {
            var webApiResponse = await _orderProductService.FindByProductId(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get order product by id
        /// </summary>
        /// <param name="orderProductId">OrderProduct id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{orderProductId}")]
        public async Task<IActionResult> GetById(Guid? orderProductId)
        {
            var webApiResponse = await _orderProductService.FindById(orderProductId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get delayed/overdue order products for notifications
        /// </summary>
        [HttpGet]
        [Route("GetDelayed")]
        public async Task<IActionResult> GetDelayed()
        {
            var webApiResponse = await _orderProductService.FindDelayed();
            return Ok(webApiResponse);
        }
    }
}
