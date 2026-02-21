using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IPhotoService
    {
        /// <summary>
        /// Saves the uploaded file and, if id provided, updates the entity's mainPhoto.
        /// Returns the stored filename/path to be returned to the businessPartner.
        /// </summary>
        Task<string> UploadImageAsync(string entityFolder, string entityId, IFormFile file);
    }
}
