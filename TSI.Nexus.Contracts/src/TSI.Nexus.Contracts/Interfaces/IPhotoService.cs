using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    /// <summary>
    /// Responsible only for updating the Photo field on entities.
    /// File storage is handled entirely by IAttachmentService.
    /// </summary>
    public interface IPhotoService
    {
        /// <summary>
        /// Saves the photo file to disk and updates the entity's Photo field.
        /// Pass null file to clear the photo.
        /// Returns the stored file name.
        /// </summary>
        Task<string> UploadImageAsync(string entityFolder, Guid entityId, IFormFile file);

        /// <summary>
        /// Returns a file result (stream + content type) for the given entity photo.
        /// </summary>
        WebApiResponse<AttachmentFileResult> GetPhotoFile(string entity, Guid entityId, string fileName);
    }
}
