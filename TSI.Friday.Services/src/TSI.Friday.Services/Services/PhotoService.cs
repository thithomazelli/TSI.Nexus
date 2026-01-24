using System.IO;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Services.Services
{
    public class PhotoService : IPhotoService
    {
        #region Properties

        private readonly IWebHostEnvironment _env;
        private readonly IRepository<Client> _clientRepository;
        private readonly IRepository<Product> _productRepository;
        private readonly IRepository<User> _userRepository;

        #endregion Properties

        #region Public methods

        /// <summary>
        ///
        /// </summary>
        /// <param name="repository"></param>
        /// <param name="env"></param>
        public PhotoService(
            IWebHostEnvironment env,
            IRepository<Client> clientRepository,
            IRepository<Product> productRepository,
            IRepository<User> userRepository
        )
        {
            _env = env;
            _clientRepository = clientRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
        }

        /// <inheritdoc />
        public async Task<string> UploadImageAsync(
            string entityFolder,
            string entityId,
            IFormFile file
        )
        {
            // use uploads folder outside of frontend public to avoid watcher reloads
            var workspaceRoot = Path.GetFullPath(Path.Combine("D:\\Development\\TSI.Friday"));
            var uploadsRoot = Path.Combine(workspaceRoot, "uploads");
            Directory.CreateDirectory(uploadsRoot);

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{ext}";
            var dirPath = Path.Combine(uploadsRoot, entityFolder);
            Directory.CreateDirectory(dirPath);
            var filePath = Path.Combine(dirPath, fileName);

            // determine previous file name from the entity so we can remove it after successful save
            string? previousFileName = null;
            Func<Task>? applyEntityUpdate = null;

            switch (entityFolder)
            {
                case "Client":
                {
                    var client = await _clientRepository.GetByIdAsync(int.Parse(entityId));
                    previousFileName = client?.Photo;
                    applyEntityUpdate = async () =>
                    {
                        if (client != null)
                        {
                            client.Photo = fileName;
                            await _clientRepository.UpdateAsync(client);
                        }
                    };
                    break;
                }
                case "User":
                {
                    var user = await _userRepository.GetByIdAsync(entityId);
                    previousFileName = user?.Photo;
                    applyEntityUpdate = async () =>
                    {
                        if (user != null)
                        {
                            user.Photo = fileName;
                            await _userRepository.UpdateAsync(user);
                        }
                    };
                    break;
                }
                case "Product":
                {
                    var product = await _productRepository.GetByIdAsync(int.Parse(entityId));
                    previousFileName = product?.Photo;
                    applyEntityUpdate = async () =>
                    {
                        if (product != null)
                        {
                            product.Photo = fileName;
                            await _productRepository.UpdateAsync(product);
                        }
                    };
                    break;
                }
            }

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Apply the prepared entity update (only one GetById was executed above)
            if (applyEntityUpdate != null)
            {
                await applyEntityUpdate();
            }

            // Move previous file to trash folder if it exists and is different from the new one
            try
            {
                if (
                    !string.IsNullOrWhiteSpace(previousFileName)
                    && !string.Equals(
                        previousFileName,
                        fileName,
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    var previousPath = Path.Combine(uploadsRoot, entityFolder, previousFileName);
                    if (File.Exists(previousPath))
                    {
                        var trashRoot = Path.Combine(workspaceRoot, "uploads_trash", entityFolder);
                        Directory.CreateDirectory(trashRoot);
                        var target = Path.Combine(trashRoot, previousFileName);
                        File.Move(previousPath, target, overwrite: true);
                    }
                }
            }
            catch
            {
                // ignore deletion errors (log if needed)
            }

            return fileName;
        }

        #endregion Public methods

        #region Private methods

        #endregion Private methos
    }
}
