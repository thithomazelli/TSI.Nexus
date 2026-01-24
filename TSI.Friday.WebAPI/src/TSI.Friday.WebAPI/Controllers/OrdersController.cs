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
    public class OrdersController : Controller
    {
        /// <summary>
        /// OrderService object created to access the service model.
        /// </summary>
        private readonly IOrderService _orderService;

        /// <summary>
        /// OrdersController constructor create to initialize the "_orderService" using Dependency Injection.
        /// </summary>
        /// <param name="orderService">IOrderService object used to initialize the internal variable using Dependency Injection.</param>
        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        /// <summary>
        /// Add order on database
        /// </summary>
        /// <param name="orderDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add([FromBody] OrderDto orderDto)
        {
                if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _orderService.Add(orderDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update order available on database
        /// </summary>
        /// <param name="orderDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] OrderDto orderDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _orderService.Update(orderDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove order when it is identified on database
        /// </summary>
        /// <param name="orderDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] OrderDto orderDto)
        {
            var webApiResponse = await _orderService.Remove(orderDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all orders available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _orderService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get order by id
        /// </summary>
        /// <param name="orderId">Order id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{orderId}")]
        public async Task<IActionResult> GetById(int? orderId)
        {
            var webApiResponse = await _orderService.FindById(orderId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get order by order number
        /// </summary>
        /// <param name="orderNumber">Order number to be used in the search</param>
        [HttpGet]
        [Route("GetByOrderNumber/{orderNumber}")]
        public async Task<IActionResult> GetByOrderNumber(string orderNumber)
        {
            var webApiResponse = await _orderService.FindByOrderNumber(orderNumber);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get orders by client id
        /// </summary>
        /// <param name="clientId">Client id to be used in the search</param>
        [HttpGet]
        [Route("GetByClientId/{clientId}")]
        public async Task<IActionResult> GetByClientId(int? clientId)
        {
            var webApiResponse = await _orderService.FindByClientId(clientId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get orders by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        [HttpGet]
        [Route("GetByProductId/{productId}")]
        public async Task<IActionResult> GetByProductId(int? productId)
        {
            var webApiResponse = await _orderService.FindByProductId(productId);
            return Ok(webApiResponse);
        }
    }
}