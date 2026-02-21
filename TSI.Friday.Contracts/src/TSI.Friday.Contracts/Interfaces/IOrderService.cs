using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces 
{
    public interface IOrderService
    {
        /// <summary>
        /// Add a new Order based on the object received.
        /// </summary>
        /// <param name="orderDto">The order DTO object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderDto>> Add(OrderDto orderDto);

        /// <summary>
        /// Update a Order based on the object received.
        /// </summary>
        /// <param name="orderDto">The order DTO object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderDto>> Update(OrderDto orderDto);

        /// <summary>
        /// Remove a Order based on the object received.
        /// </summary>
        /// <param name="orderDto">The order DTO object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderDto>> Remove(OrderDto orderDto);

        /// <summary>
        /// Method responsible to get all registers available on The order data table.
        /// </summary>
        /// <returns>All registers found on The order data table.</returns>
        Task<WebApiResponse<IEnumerable<OrderDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Order based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Order object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<OrderDto>> FindById(int? id);

        /// <summary>
        /// Should find a Order that based on the OrderNumber received as parameter.
        /// </summary>
        /// <param name="orderNumber">The OrderNumber to be used on the search.</param>
        /// <returns>One Order object according to the OrderNumber defined as parameter.</returns>
        Task<WebApiResponse<OrderDto>> FindByOrderNumber(string orderNumber);

        /// <summary>
        /// Method responsible to get a list of Orders based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="businessPartnerId">The ID to be used on the search.</param>
        /// <returns>List of order according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<OrderDto>>> FindByBusinessPartnerId(int? businessPartnerId);

        /// <summary>
        /// Method responsible to get a list of Orders based on the ProductID received as parameter.
        /// </summary>
        /// <param name="productId">The ID to be used on the search.</param>
        /// <returns>List of order according to the ProductID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<OrderDto>>> FindByProductId(int? productId);
    }
}
