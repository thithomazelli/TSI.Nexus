using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IProductPhotoService
    {
        /// <summary>
        /// Add a new ProductPhoto based on the object received.
        /// </summary>
        /// <param name="productPhoto">The productPhoto object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ProductPhoto>> Add(ProductPhoto productPhoto);

        /// <summary>
        /// Update a ProductPhoto based on the object received.
        /// </summary>
        /// <param name="productPhoto">The productPhoto object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ProductPhoto>> Update(ProductPhoto productPhoto);

        /// <summary>
        /// Remove a ProductPhoto based on the object received.
        /// </summary>
        /// <param name="productPhoto">The productPhoto object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<ProductPhoto>> Remove(ProductPhoto productPhoto);

        /// <summary>
        /// Method responsible to get only one ProductPhoto based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One ProductPhoto object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<ProductPhoto>> FindById(int? id);

        /// <summary>
        /// Should find the default ProductPhoto based on the ProductId received as parameter.
        /// </summary>
        /// <param name="productId">The ProductId to be used on the search.</param>
        /// <returns>Default ProductPhoto object according to the ProductId defined as parameter.</returns>
        Task<WebApiResponse<ProductPhoto>> FindDefaultByProduct(int productId);

        /// <summary>
        /// Method responsible to get all registers available on The productPhoto database.
        /// </summary>
        /// <param name="productPhoto">The productPhoto object to be removed.</param>
        /// <returns>All registers found on the ProductPhoto database.</returns>
        Task<WebApiResponse<IEnumerable<ProductPhoto>>> FindAllByProduct(int productId);
    }
}
