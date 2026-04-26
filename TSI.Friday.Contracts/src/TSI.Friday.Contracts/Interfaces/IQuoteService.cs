using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IQuoteService
    {
        /// <summary>
        /// Add a new Quote based on the object received.
        /// </summary>
        /// <param name="quoteDto">The quote DTO object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteDto>> Add(QuoteDto quoteDto);

        /// <summary>
        /// Update a Quote based on the object received.
        /// </summary>
        /// <param name="quoteDto">The quote DTO object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteDto>> Update(QuoteDto quoteDto);

        /// <summary>
        /// Remove a Quote based on the object received.
        /// </summary>
        /// <param name="quoteDto">The quote DTO object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteDto>> Remove(QuoteDto quoteDto);

        /// <summary>
        /// Method responsible to get all registers available on The quote database.
        /// </summary>
        /// <returns>All registers found on The quote database.</returns>
        Task<WebApiResponse<IEnumerable<QuoteDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Quote based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Quote object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<QuoteDto>> FindById(Guid? id);

        /// <summary>
        /// Should find a Quote that based on the QuoteNumber received as parameter.
        /// </summary>
        /// <param name="quoteNumber">The QuoteNumber to be used on the search.</param>
        /// <returns>One Quote object according to the QuoteNumber defined as parameter.</returns>
        Task<WebApiResponse<QuoteDto>> FindByQuoteNumber(string quoteNumber);

        /// <summary>
        /// Method responsible to get a list of Quotes based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="businessPartnerId">The ID to be used on the search.</param>
        /// <returns>List of quote according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<QuoteDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        );

        /// <summary>
        /// Method responsible to get a list of Quotes based on the ProductID received as parameter.
        /// </summary>
        /// <param name="productId">The ID to be used on the search.</param>
        /// <returns>List of quote according to the ProductID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<QuoteDto>>> FindByProductId(Guid? productId);

        /// <summary>
        /// Convert a Quote into an Order. Checks product availability for sale/rental products before conversion.
        /// If some products are out of stock, returns a warning with details so the UI may prompt the user.
        /// Otherwise calls OrderService.Add() to create the order and returns that response.
        /// </summary>
        Task<WebApiResponse<TSI.Friday.Contracts.Models.DTOs.OrderDto>> ConvertToOrder(QuoteDto quoteDto);
    }
}
