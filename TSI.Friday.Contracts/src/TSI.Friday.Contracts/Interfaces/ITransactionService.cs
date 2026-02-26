using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Text.Json.Nodes;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ITransactionService
    {
        /// <summary>
        /// Add a new Transaction based on the object received.
        /// </summary>
        /// <param name="transactionDto">The transaction object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<TransactionDto>> Add(TransactionDto transactionDto);

        /// <summary>
        /// Update a Transaction based on the object received.
        /// </summary>
        /// <param name="transactionDto">The transaction object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<TransactionDto>> Update(TransactionDto transactionDto);

        /// <summary>
        /// Update the OrderId in a Transaction based on the object received.
        /// </summary>
        /// <param name="transactionDto">The transaction object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<TransactionDto>> UpdateOrderId(TransactionDto transactionDto);

        /// <summary>
        /// Remove a Transaction based on the object received.
        /// </summary>
        /// <param name="transactionDto">The transaction object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<TransactionDto>> Remove(TransactionDto transactionDto);

        /// <summary>
        /// Method responsible to get all registers available on the transaction database.
        /// </summary>
        /// <returns>All registers found on the transaction database.</returns>
        Task<WebApiResponse<IEnumerable<TransactionDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Transaction based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One transaction object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<TransactionDto>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get a list of Transactiones based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>List of transaction according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<TransactionDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        );

        /// <summary>
        /// Get transactions grouped by category summing payments for each category.
        /// </summary>
        /// <param name="type">Optional TransactionType to filter. If null returns both types.</param>
        /// <param name="start">Optional start date (inclusive).</param>
        /// <param name="end">Optional end date (inclusive).</param>
        /// <returns>WebApiResponse with a JsonObject containing grouped results.</returns>
        Task<WebApiResponse<JsonObject>> GetTransactionsGroupByCategory(TransactionType? type = null, DateTime? start = null, DateTime? end = null);
    }
}
