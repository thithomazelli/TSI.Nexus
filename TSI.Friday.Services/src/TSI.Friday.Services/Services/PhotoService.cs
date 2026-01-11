using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.Services.Services
{
    public class PhotoService : IPhotoService
    {
        #region Properties

        private readonly IRepository<object> _repository; // ou IGenericRepository
        private readonly IWebHostEnvironment _env;
        private readonly long _maxBytes = 5 * 1024 * 1024; // ex.: 5MB

        #endregion Properties

        #region Public methods

        /// <summary>
        /// 
        /// </summary>
        /// <param name="repository"></param>
        /// <param name="env"></param>
        public PhotoService(IRepository<object> repository, IWebHostEnvironment env)
        {
            _repository = repository;
            _env = env;
        }

        #endregion Public methods

        /// <inheritdoc />
        public async Task<string> UploadImageAsync(IFormFile file, string entityFolder, int? id = null, CancellationToken ct = default)
        {
            if (file == null) throw new ArgumentNullException(nameof(file));

            // 1) Save file (delegado a IFileStorageService)
            var storedPath = await SaveImageAsync(file, entityFolder, ct);

            // 2) If id present, update entity mainPhoto
            if (id.HasValue)
            {
                //var product = await _repository.GetById(id.Value);
                //if (product != null)
                //{
                //    product.MainPhoto = storedPath;
                //    await _repository.Update(product, ct);
                //}
                //else
                //{

                //}
            }

            return storedPath;
        }

        #region Private methods

        private async Task<string> SaveImageAsync(IFormFile file, string entityFolder, CancellationToken ct = default)
        {
            if (file.Length == 0) throw new ArgumentException("File empty");
            if (file.Length > _maxBytes) throw new InvalidOperationException("File too large");

            var allowed = new[] { "image/png", "image/jpeg", "image/webp" };
            if (!allowed.Contains(file.ContentType)) throw new InvalidOperationException("Invalid file type");

            var uploadsRoot = Path.Combine(_env.WebRootPath ?? "wwwroot", "uploads", entityFolder);
            Directory.CreateDirectory(uploadsRoot);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid():N}{ext}";
            var absPath = Path.Combine(uploadsRoot, fileName);
            using var stream = new FileStream(absPath, FileMode.Create);
            await file.CopyToAsync(stream, ct);

            var relativePath = Path.Combine("uploads", entityFolder, fileName).Replace('\\', '/');
            return relativePath; // e.g. "uploads/products/abcd.png"
        }

        #endregion Private methos
    }
}