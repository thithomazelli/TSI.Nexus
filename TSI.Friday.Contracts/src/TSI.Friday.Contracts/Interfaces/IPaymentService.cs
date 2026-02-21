using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPaymentService
    {
        /// <summary>
        /// Add a new Payment based on the object received.
        /// </summary>
        /// <param name="paymentDto">The payment object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Add(PaymentDto paymentDto);

        /// <summary>
        /// Update an Payment based on the object received.
        /// </summary>
        /// <param name="paymentDto">The payment object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Update(PaymentDto paymentDto);

        /// <summary>
        /// Remove an Payment based on the object received.
        /// </summary>
        /// <param name="paymentDto">The payment object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentDto>> Remove(PaymentDto paymentDto);

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
        Task<WebApiResponse<PaymentDto>> FindById(int? id);

        /// <summary>
        /// Method responsible to get a list of Paymentes based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>List of payment according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentDto>>> FindByBusinessPartnerId(
            int? businessPartnerId
        );
    }
}
