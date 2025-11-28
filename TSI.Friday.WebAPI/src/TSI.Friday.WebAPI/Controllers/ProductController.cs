using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class ProductController : Controller
    {
        /// <summary>
        /// ProductService object created to access the service model.
        /// </summary>
        private readonly IProductService _productService;

        /// <summary>
        /// ProductsController constructor create to initialize the "_productService" using Dependency Injection.
        /// </summary>
        /// <param name="productService ">IProductService object used to initialize the internal variable using Dependency Injection.</param>
        public ProductController(IProductService productService)
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
        public IActionResult Add(Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _productService.Add(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update product available on database
        /// </summary>
        /// <param name="product">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public IActionResult Update([FromBody] Product product)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = _productService.Update(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove product when it is identified on database
        /// </summary>
        /// <param name="product">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public IActionResult Remove([FromBody] Product product)
        {
            var webApiResponse = _productService.Remove(product);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all products available on database (created only for the initial tests)
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAll")]
        public IActionResult GetAll()
        {
            var webApiResponse = _productService.FindAll();
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get product by id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]

        [Route("GetById/{productId}")]
        public IActionResult GetById(int? productId)
        {
            var webApiResponse = _productService.FindById(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get product by sku
        /// </summary>
        /// <param name="sku">Sku to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetBySku/{sku}")]
        public IActionResult GetBySku(string sku)
        {
            var webApiResponse = _productService.FindBySku(sku);
            return Ok(webApiResponse);
        }
    }
}