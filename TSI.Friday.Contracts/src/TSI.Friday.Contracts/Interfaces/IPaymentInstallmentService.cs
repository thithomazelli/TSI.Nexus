using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPaymentInstallmentService
    {
        /// <summary>
        /// Add a new PaymentInstallment based on the object received.
        /// </summary>
        /// <param name="PaymentInstallmentDto">The paymentInstallment object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentInstallmentDto>> Add(
            PaymentInstallmentDto paymentInstallmentDto
        );

        /// <summary>
        /// Update an PaymentInstallment based on the object received.
        /// </summary>
        /// <param name="paymentInstallmentDto">The paymentInstallment object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentInstallmentDto>> Update(
            PaymentInstallmentDto paymentInstallmentDto
        );

        /// <summary>
        /// Remove an PaymentInstallment based on the object received.
        /// </summary>
        /// <param name="paymentInstallmentDto">The paymentInstallment object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PaymentInstallmentDto>> Remove(
            PaymentInstallmentDto paymentInstallmentDto
        );

        /// <summary>
        /// Method responsible to get all registers available on the paymentInstallment data table.
        /// </summary>
        /// <returns>All registers found on the paymentInstallment data table.</returns>
        Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindAll();

        /// <summary>
        /// Method responsible to get only one PaymentInstallment based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One paymentInstallment object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<PaymentInstallmentDto>> FindById(int? id);

        /// <summary>
        /// Method responsible to get a list of PaymentInstallments based on the PaymentID received as parameter.
        /// </summary>
        /// <param name="paymentId">The ID to be used on the search.</param>
        /// <returns>List of paymentInstallments according to the PaymentID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByPaymentId(int? paymentId);

        /// <summary>
        /// Method responsible to get a list of PaymentInstallments based on the BusinessPartnerID received as parameter.
        /// </summary>
        /// <param name="businessPartnerId">The ID to be used on the search.</param>
        /// <returns>List of paymentInstallments according to the BusinessPartnerID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByBusinessPartnerId(int? businessPartnerId);

        /// <summary>
        /// Method responsible to get a list of PaymentInstallments based on the OrderID received as parameter.
        /// </summary>
        /// <param name="orderId">The ID to be used on the search.</param>
        /// <returns>List of paymentInstallments according to the OrderID defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PaymentInstallmentDto>>> FindByOrderId(int? orderId);
    }
}
