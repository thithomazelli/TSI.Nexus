using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IOrderProductService
    {
        /// <summary>
        /// Add a new OrderProduct based on the object received.
        /// </summary>
        /// <param name="orderProductDto">The orderProduct object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderProductDto>> Add(OrderProductDto orderProductDto);

        /// <summary>
        /// Update a OrderProduct based on the object received.
        /// </summary>
        /// <param name="orderProductDto">The orderProduct object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderProductDto>> Update(OrderProductDto orderProductDto);

        /// <summary>
        /// Remove a OrderProduct based on the object received.
        /// </summary>
        /// <param name="orderProductDto">The orderProduct object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<OrderProductDto>> Remove(OrderProductDto orderProductDto);

        /// <summary>
        /// Method responsible to get all registers available in the order products database.
        /// </summary>
        /// <returns>All registers found in the order products database.</returns>
        Task<WebApiResponse<IEnumerable<OrderProductDto>>> FindAll();

        /// <summary>
        /// Method responsible to get a list of OrderProducts based on the OrderId received as parameter.
        /// </summary>
        /// <param name="orderId">The ID to be used on the search.</param>
        /// <returns>List of orderProduct according to the OrderId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<OrderProductDto>>> FindByOrderId(Guid? orderId);

        /// <summary>
        /// Method responsible to get a list of OrderProducts based on the ProductId received as parameter.
        /// </summary>
        /// <param name="productId">The product ID to be used on the search.</param>
        /// <returns>List of orderProduct according to the ProductId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<OrderProductDto>>> FindByProductId(Guid? productId);

        /// <summary>
        /// Method responsible to get only one OrderProduct based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One OrderProduct object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<OrderProductDto>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get OrderProducts considered delayed/overdue for notifications.
        /// Rules: status == Delayed OR (status != Returned && EndDate < today) — compare dates using only day/month/year (UTC).
        /// </summary>
        Task<WebApiResponse<IEnumerable<OrderProductDto>>> FindDelayed();
    }
}
