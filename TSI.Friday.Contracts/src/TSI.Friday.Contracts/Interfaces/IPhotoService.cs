using Microsoft.AspNetCore.Http;
using System.Threading;
using System.Threading.Tasks;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPhotoService
    {
        /// <summary>
        /// Saves the uploaded file and, if id provided, updates the entity's mainPhoto.
        /// Returns the stored filename/path to be returned to the client.
        /// </summary>
        Task<string> UploadImageAsync(IFormFile file, string entityFolder, int? id = null, CancellationToken ct = default);
    }
}
