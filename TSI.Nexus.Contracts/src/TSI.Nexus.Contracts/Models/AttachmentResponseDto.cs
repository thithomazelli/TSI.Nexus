using System;

namespace TSI.Nexus.Contracts.Models
{
    /// <summary>
    /// DTO returned to the client for attachment listings.
    /// Contains metadata and a ready-to-use download URL.
    /// </summary>
    public class AttachmentResponseDto
    {
        public Guid Id { get; set; }

        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Relative path representing the folder structure (e.g. "BusinessPartners/ClienteX/Orders").
        /// Used by the front-end to build a directory tree (like Google Drive).
        /// Does NOT include the file name � only the folder hierarchy.
        /// </summary>
        public string Path { get; set; } = string.Empty;

        /// <summary>
        /// Authenticated download URL (e.g. /api/Attachments/GetFileById/{id}).
        /// </summary>
        public string DownloadUrl { get; set; } = string.Empty;

        public Guid? BusinessPartnerId { get; set; }

        public Guid? OrderId { get; set; }

        public Guid? PurchaseOrderId { get; set; }

        public Guid? TripId { get; set; }

        public Guid? TransactionId { get; set; }

        public Guid? PaymentId { get; set; }

        public Guid? ProductId { get; set; }

        public Guid? VehicleId { get; set; }

        public Guid? DriverId { get; set; }

        public Guid? VehicleMaintenanceId { get; set; }

        public string UserId { get; set; }

        public DateTime CreateDate { get; set; }

        public DateTime ModifyDate { get; set; }
    }
}
