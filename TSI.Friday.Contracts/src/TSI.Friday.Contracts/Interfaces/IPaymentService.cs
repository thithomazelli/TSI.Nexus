using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// Add a new Payment based on the object received.
        /// </summary>
        /// <param name="PaymentDto">The payment object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Add(
            PaymentDto paymentDto
        );

        /// <summary>
        /// Update an Payment based on the object received.
        /// </summary>
        /// <param name="paymentDto">The payment object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Update(
            PaymentDto paymentDto
        );

        /// <summary>
        /// Remove an Payment based on the object received.
        /// </summary>
        /// <param name="paymentDto">The payment object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Remove(
            PaymentDto paymentDto
        );

        /// <summary>
        /// Method responsible to get all registers available on the payment database.
        /// </summary>
        /// <returns>All registers found on the payment database.</returns>
        Task<WebApiResponse<IEnumerable<PaymentDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one Payment based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One payment object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<PaymentDto>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get a list of Payments based on the TransactionID received as parameter.
        /// </summary>
        /// <param name="transactionId">The ID to be used on the search.</param>
        /// <returns>List of payments according to the TransactionID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByTransactionId(Guid? transactionId);

        /// <summary>
        /// Method responsible to get a list of Payments based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="businessPartnerId">The ID to be used on the search.</param>
        /// <returns>List of payments according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByBusinessPartnerId(
            Guid? businessPartnerId
        );

        /// <summary>
        /// Method responsible to get a list of Payments based on the OrderID received as parameter.
        /// </summary>
        /// <param name="orderId">The ID to be used on the search.</param>
        /// <returns>List of payments according to the OrderID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByOrderId(Guid? orderId);
    }
}
