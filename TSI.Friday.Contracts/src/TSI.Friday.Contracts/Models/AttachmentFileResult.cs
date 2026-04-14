using System.IO;

namespace TSI.Friday.Contracts.Models
{
    /// <summary>
    /// Represents the result of a file download operation, containing the stream, content type and file name.
    /// </summary>
    public class AttachmentFileResult
    {
        /// <summary>
        /// The file stream to be returned to the client.
        /// </summary>
        public Stream Stream { get; set; } = null!;

        /// <summary>
        /// The MIME content type of the file (e.g. "application/pdf", "image/png").
        /// </summary>
        public string ContentType { get; set; } = "application/octet-stream";

        /// <summary>
        /// The original file name to be used in the download response.
        /// </summary>
        public string FileName { get; set; } = string.Empty;
    }
}
