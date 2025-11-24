using System.Collections.Generic;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utitlities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IProductService
    {
        /// <summary>
        /// Add a new Product based on the object received.
        /// </summary>
        /// <param name="product">The product object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Product> Add(Product product);

        /// <summary>
        /// Update a Product based on the object received.
        /// </summary>
        /// <param name="product">The product object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Product> Update(Product product);

        /// <summary>
        /// Remove a Product based on the object received.
        /// </summary>
        /// <param name="product">The product object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        public WebApiResponse<Product> Remove(Product product);

        /// <summary>
        /// Method responsible to get all registers available on The product data table.
        /// </summary>
        /// <returns>All registers found on The product data table.</returns>
        public WebApiResponse<IEnumerable<Product>> FindAll();

        /// <summary>
        /// Method responsible to get only one Product based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Product object according to the ID defined as parameter.</returns>
        public WebApiResponse<Product> FindById(int? id);

        /// <summary>
        /// Should find a Product that based on the Sku received as parameter.
        /// </summary>
        /// <param name="sku">The Sku to be used on the search.</param>
        /// <returns>One Product object according to the Sku defined as parameter.</returns>
        public WebApiResponse<Product> FindBySku(string sku);
    }

}
