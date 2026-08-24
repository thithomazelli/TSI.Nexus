using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IPurchaseOrderProductService
    {
        /// <summary>
        /// Add a new PurchaseOrderProduct based on the object received.
        /// </summary>
        /// <param name="purchaseOrderProductDto">The purchaseOrderProduct object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PurchaseOrderProductDto>> Add(
            PurchaseOrderProductDto purchaseOrderProductDto
        );

        /// <summary>
        /// Update a PurchaseOrderProduct based on the object received.
        /// </summary>
        /// <param name="purchaseOrderProductDto">The purchaseOrderProduct object updated.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PurchaseOrderProductDto>> Update(
            PurchaseOrderProductDto purchaseOrderProductDto
        );

        /// <summary>
        /// Remove a PurchaseOrderProduct based on the object received.
        /// </summary>
        /// <param name="purchaseOrderProductDto">The purchaseOrderProduct object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<PurchaseOrderProductDto>> Remove(
            PurchaseOrderProductDto purchaseOrderProductDto
        );

        /// <summary>
        /// Method responsible to get all registers available in the purchase order products database.
        /// </summary>
        /// <returns>All registers found in the purchase order products database.</returns>
        Task<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>> FindAll();

        /// <summary>
        /// Method responsible to get a list of PurchaseOrderProducts based on the PurchaseOrderId received as parameter.
        /// </summary>
        /// <param name="purchaseOrderId">The ID to be used on the search.</param>
        /// <returns>List of purchaseOrderProduct according to the PurchaseOrderId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>> FindByPurchaseOrderId(
            Guid? purchaseOrderId
        );

        /// <summary>
        /// Method responsible to get a list of PurchaseOrderProducts based on the ProductId received as parameter.
        /// </summary>
        /// <param name="productId">The product ID to be used on the search.</param>
        /// <returns>List of purchaseOrderProduct according to the ProductId defined as parameter.</returns>
        Task<WebApiResponse<IEnumerable<PurchaseOrderProductDto>>> FindByProductId(
            Guid? productId
        );

        /// <summary>
        /// Method responsible to get only one PurchaseOrderProduct based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One PurchaseOrderProduct object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<PurchaseOrderProductDto>> FindById(Guid? id);
    }
}
