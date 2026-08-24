using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class ProductPhotosController : Controller
    {
        /// <summary>
        /// ProductPhotoService object created to access the service model.
        /// </summary>
        private readonly IProductPhotoService _productPhotoService;

        /// <summary>
        /// ProductPhotosController constructor create to initialize the "_productPhotoService" using Dependency Injection.
        /// </summary>
        /// <param name="productPhotoService ">IProductPhotoService object used to initialize the internal variable using Dependency Injection.</param>
        public ProductPhotosController(IProductPhotoService productPhotoService)
        {
            _productPhotoService = productPhotoService;
        }

        /// <summary>
        /// Add productPhoto on database
        /// </summary>
        /// <param name="productPhoto">Object to be added</param>
        /// <returns></returns>
        [HttpPost]
        [Route("Add")]
        public async Task<IActionResult> Add(ProductPhoto productPhoto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _productPhotoService.Add(productPhoto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Update productPhoto available on database
        /// </summary>
        /// <param name="productPhoto">Object to be updated</param>
        /// <returns></returns>
        [HttpPut]
        [Route("Update")]
        public async Task<IActionResult> Update([FromBody] ProductPhoto productPhoto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var webApiResponse = await _productPhotoService.Update(productPhoto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Remove productPhoto when it is identified on database
        /// </summary>
        /// <param name="productPhoto">Object to be removed</param>
        /// <returns></returns>
        [HttpDelete]
        [Route("Remove")]
        public async Task<IActionResult> Remove([FromBody] ProductPhoto productPhoto)
        {
            var webApiResponse = await _productPhotoService.Remove(productPhoto);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get productPhoto by id
        /// </summary>
        /// <param name="productPhotoId">ProductPhoto id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetById/{productPhotoId}")]
        public async Task<IActionResult> GetById(Guid? productPhotoId)
        {
            var webApiResponse = await _productPhotoService.FindById(productPhotoId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get productPhoto by product id
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetDefaultByProduct/{productId}")]
        public async Task<IActionResult> GetDefaultByProduct(Guid productId)
        {
            var webApiResponse = await _productPhotoService.FindDefaultByProduct(productId);
            return Ok(webApiResponse);
        }

        /// <summary>
        /// Get all productPhotos available on database
        /// </summary>
        /// <param name="productId">Product id to be used in the search</param>
        /// <returns></returns>
        [HttpGet]
        [Route("GetAlllByProduct")]
        public async Task<IActionResult> GetAlllByProduct(Guid productId)
        {
            var webApiResponse = await _productPhotoService.FindAllByProduct(productId);
            return Ok(webApiResponse);
        }
    }
}
