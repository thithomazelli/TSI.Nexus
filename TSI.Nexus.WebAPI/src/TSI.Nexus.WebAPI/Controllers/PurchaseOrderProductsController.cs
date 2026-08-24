using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrderProductsController : Controller
    {
        /// <summary>
        /// PurchaseOrderProductService object created to access the service model.
        /// </summary>
        private readonly IPurchaseOrderProductService _purchaseOrderProductService;

        /// <summary>
        /// PurchaseOrderProductsController constructor create to initialize the "_purchaseOrderProductService" using Dependency Injection.
        /// </summary>
        /// <param name="purchaseOrderProductService">IPurchaseOrderProductService object used to initialize the internal variable using Dependency Injection.</param>
        public PurchaseOrderProductsController(
            IPurchaseOrderProductService purchaseOrderProductService
        )
        {
            _purchaseOrderProductService = purchaseOrderProductService;
        }

        /// <summary>
        /// Add purchaseOrderProduct on database
        /// </summary>
        /// <param name="purchaseOrderProductDto">Object to be added</param>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(
            [FromBody] PurchaseOrderProductDto purchaseOrderProductDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _purchaseOrderProductService.Add(purchaseOrderProductDto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update purchaseOrderProduct available on database
        /// </summary>
        /// <param name="purchaseOrderProductDto">Object to be updated</param>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update(
            [FromBody] PurchaseOrderProductDto purchaseOrderProductDto
        )
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _purchaseOrderProductService.Update(
                purchaseOrderProductDto
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove purchaseOrderProduct when it is identified on database
        /// </summary>
        /// <param name="purchaseOrderProductDto">Object to be removed</param>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove(
            [FromBody] PurchaseOrderProductDto purchaseOrderProductDto
        )
        {
            var webApiResponse = await _purchaseOrderProductService.Remove(
                purchaseOrderProductDto
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all purchase order products available on database
        /// </summary>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _purchaseOrderProductService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get purchase order products by purchase order id
        /// </summary>
        /// <param name="purchaseOrderId">PurchaseOrder id to be used in the search</param>
        [HttpGet]
        [Route("GetByPurchaseOrderId/{purchaseOrderId}")]
        public async Task<IActionResult> GetByPurchaseOrderId(Guid? purchaseOrderId)
        {
            var webApiResponse = await _purchaseOrderProductService.FindByPurchaseOrderId(
                purchaseOrderId
            );
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get purchase order products by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        [HttpGet]
        [Route("GetByProductId/{productId}")]
        public async Task<IActionResult> GetByProductId(Guid? productId)
        {
            var webApiResponse = await _purchaseOrderProductService.FindByProductId(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get purchase order product by id
        /// </summary>
        /// <param name="purchaseOrderProductId">PurchaseOrderProduct id to be used in the search</param>
        [HttpGet]
        [Route("GetById/{purchaseOrderProductId}")]
        public async Task<IActionResult> GetById(Guid? purchaseOrderProductId)
        {
            var webApiResponse = await _purchaseOrderProductService.FindById(
                purchaseOrderProductId
            );
            return Ok(webApiResponse);
        }
    }
}
