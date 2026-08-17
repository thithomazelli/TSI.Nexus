using System;
using Microsoft.AspNetCore.Http;

namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// DTO used for attachment operations from multipart/form-data requests.
    /// </summary>
    public class AttachmentDto
    {
        /// <summary>
        /// Uploaded file (optional for update operations).
        /// </summary>
        public IFormFile? File { get; set; }

        /// <summary>
        /// Attachment id (used for updates).
        /// </summary>
        public Guid? Id { get; set; }

        public Guid? BusinessPartnerId { get; set; }

        public Guid? OrderId { get; set; }

        /// <summary>
        /// Order number used to resolve OrderId when navigating the folder tree.
        /// When provided and OrderId is null, the service will look up the Order by this number.
        /// </summary>
        public string OrderNumber { get; set; }

        public Guid? TripId { get; set; }

        /// <summary>
        /// Trip number used to resolve TripId when navigating the folder tree.
        /// When provided and TripId is null, the service will look up the Trip by this number.
        /// </summary>
        public string TripNumber { get; set; }

        public Guid? QuoteId { get; set; }

        public Guid? TransactionId { get; set; }

        public Guid? PaymentId { get; set; }

        public Guid? ProductId { get; set; }

        public string UserId { get; set; }
    }
}
