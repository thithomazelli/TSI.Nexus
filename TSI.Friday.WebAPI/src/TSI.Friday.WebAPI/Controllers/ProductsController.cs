using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : Controller
    {
        /// <summary>
        /// ProductService object created to access the service model.
        /// </summary>
        private readonly IProductService _productService;

        /// <summary>
        /// ProductsController constructor create to initialize the "_productService" using Dependency Injection.
        /// </summary>
        /// <param name="productService ">IProductService object used to initialize the internal variable using Dependency Injection.</param>
        public ProductsController(IProductService productService)
        {
            _productService = productService;
        }

        /// <summary>
        /// Add product on database
        /// </summary>
        /// <param name="product">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _productService.Add(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update product available on database
        /// </summary>
        /// <param name="product">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _productService.Update(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove product when it is identified on database
        /// </summary>
        /// <param name="product">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] Product product)
        {
            var webApiResponse = await _productService.Remove(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all products available on database
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public async Task<IActionResult> GetAll()
        {
            var webApiResponse = await _productService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get product by id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetById/{productId}")]
        public async Task<IActionResult> GetById(int? productId)
        {
            var webApiResponse = await _productService.FindById(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get product by sku
        /// </summary>
        /// <param name="sku">Sku to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetBySku/{sku}")]
        public async Task<IActionResult> GetBySku(string sku)
        {
            var webApiResponse = await _productService.FindBySku(sku);
            return Ok(webApiResponse);
        }
    }
}
