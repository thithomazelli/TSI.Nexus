using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IQuoteProductService
    {
        /// <summary>
        /// Add a new QuoteProduct based on the object received.
        /// </summary>
        /// <param name="quoteProductDto">The quoteProduct object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteProductDto>> Add(QuoteProductDto quoteProductDto);

        /// <summary>
        /// Update a QuoteProduct based on the object received.
        /// </summary>
        /// <param name="quoteProductDto">The quoteProduct object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteProductDto>> Update(QuoteProductDto quoteProductDto);

        /// <summary>
        /// Remove a QuoteProduct based on the object received.
        /// </summary>
        /// <param name="quoteProductDto">The quoteProduct object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteProductDto>> Remove(QuoteProductDto quoteProductDto);

        /// <summary>
        /// Method responsible to get all registers available in the quote products database.
        /// </summary>
        /// <returns>All registers found in the quote products database.</returns>
        Task<WebApiResponse<IEnumerable<QuoteProductDto>>> FindAll();

        /// <summary>
        /// Method responsible to get a list of QuoteProducts based on the OrderId received as parameter.
        /// </summary>
        /// <param name="orderId">The ID to be used on the search.</param>
        /// <returns>List of quoteProduct according to the OrderId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<QuoteProductDto>>> FindByOrderId(Guid? orderId);

        /// <summary>
        /// Method responsible to get a list of QuoteProducts based on the ProductId received as parameter.
        /// </summary>
        /// <param name="productId">The product ID to be used on the search.</param>
        /// <returns>List of quoteProduct according to the ProductId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<QuoteProductDto>>> FindByProductId(Guid? productId);

        /// <summary>
        /// Method responsible to get only one QuoteProduct based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One QuoteProduct object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<QuoteProductDto>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get QuoteProducts considered delayed/overdue for notifications.
        /// Rules: status == Delayed OR (status != Returned && EndDate < today) — compare dates using only day/month/year (UTC).
        /// </summary>
        Task<WebApiResponse<IEnumerable<QuoteProductDto>>> FindDelayed();
    }
}
