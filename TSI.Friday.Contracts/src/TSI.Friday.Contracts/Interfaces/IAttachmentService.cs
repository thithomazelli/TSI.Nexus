using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// Defines methods for managing file attachments in the system.
    /// </summary>
    public interface IAttachmentService
    {
        /// <summary>
        /// Adds a new attachment file and persists the attachment metadata. The uploaded file and linkage ids are provided inside <see cref="AttachmentDto"/>.
        /// </summary>
        /// <param name="dto">Attachment DTO containing the file and optional linkage ids (BusinessPartnerId, OrderId, ...).</param>
        /// <param name="overridePath">Optional override path to store the file instead of the configured default.</param>
        /// <returns>The saved attachment with persisted metadata.</returns>
        Task<WebApiResponse<AttachmentResponseDto>> Add(
            AttachmentDto dto,
            string overridePath = null
        );

        /// <summary>
        /// Updates an existing attachment metadata and optionally replaces the stored file. The file (if provided) and metadata are inside <see cref="AttachmentDto"/>.
        /// </summary>
        /// <param name="dto">Attachment DTO containing Id, optional file and linkage ids.</param>
        /// <param name="overridePath">Optional override path to store the file instead of the configured default.</param>
        /// <returns>The updated attachment.</returns>
        Task<WebApiResponse<AttachmentResponseDto>> Update(
            AttachmentDto dto,
            string overridePath = null
        );

        /// <summary>
        /// Deletes an attachment and removes the stored file from disk.
        /// </summary>
        /// <param name="id">Attachment id to delete.</param>
        /// <returns>The deleted attachment information when successful.</returns>
        Task<WebApiResponse<AttachmentResponseDto>> Delete(Guid id);

        /// <summary>
        /// Retrieves an attachment metadata by its id, including download URL.
        /// </summary>
        /// <param name="id">Attachment id.</param>
        /// <returns>The attachment metadata with download URL if found.</returns>
        Task<WebApiResponse<AttachmentResponseDto>> GetById(Guid id);

        /// <summary>
        /// Retrieves the physical file for a given attachment id, returning stream, content type and file name.
        /// </summary>
        /// <param name="id">Attachment id.</param>
        /// <returns>An <see cref="AttachmentFileResult"/> with file stream, content type and file name; or null if not found.</returns>
        Task<WebApiResponse<AttachmentFileResult>> GetFileById(Guid id);

        /// <summary>
        /// Gets attachments linked to a specific business partner, including download URLs.
        /// </summary>
        /// <param name="businessPartnerId">Business partner id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByBusinessPartnerId(
            Guid businessPartnerId
        );

        /// <summary>
        /// Gets attachments linked to a specific order, including download URLs.
        /// </summary>
        /// <param name="orderId">Order id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByOrderId(Guid orderId);

        /// <summary>
        /// Gets attachments linked to a specific transaction, including download URLs.
        /// </summary>
        /// <param name="transactionId">Transaction id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByTransactionId(
            Guid transactionId
        );

        /// <summary>
        /// Gets attachments linked to a specific payment, including download URLs.
        /// </summary>
        /// <param name="paymentId">Payment id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByPaymentId(Guid paymentId);

        /// <summary>
        /// Gets attachments linked to a specific product, including download URLs.
        /// </summary>
        /// <param name="productId">Product id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByProductId(Guid productId);

        /// <summary>
        /// Gets attachments linked to a specific user, including download URLs.
        /// </summary>
        /// <param name="userId">User id.</param>
        /// <returns>Collection of attachment response DTOs.</returns>
        Task<WebApiResponse<IEnumerable<AttachmentResponseDto>>> GetByUserId(string userId);
    }
}
