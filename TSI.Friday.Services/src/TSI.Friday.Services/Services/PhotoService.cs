using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore.Internal;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Services.Services
{
    public class PhotoService : IPhotoService
    {
        #region Properties

        private readonly IWebHostEnvironment _env;
        private readonly IRepository<BusinessPartner> _businessPartnerRepository;
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
            IRepository<BusinessPartner> businessPartnerRepository,
            IRepository<Product> productRepository,
            IRepository<User> userRepository
        )
        {
            _env = env;
            _businessPartnerRepository = businessPartnerRepository;
            _productRepository = productRepository;
            _userRepository = userRepository;
        }

        /// <inheritdoc />
        public async Task<string> UploadImageAsync(
            string entityFolder,
            Guid entityId,
            IFormFile? file
        )
        {
            try
            {
                // use uploads folder outside of frontend public to avoid watcher reloads
                var workspaceRoot = Path.GetFullPath(Path.Combine("D:\\Development\\TSI.Friday"));
                var uploadsRoot = Path.Combine(workspaceRoot, "uploads");
                Directory.CreateDirectory(uploadsRoot);

                var ext = Path.GetExtension(file?.FileName);
                var fileName = ext != null ? $"{Guid.NewGuid()}{ext}" : string.Empty;
                var dirPath = Path.Combine(uploadsRoot, entityFolder);
                Directory.CreateDirectory(dirPath);
                var filePath = Path.Combine(dirPath, fileName);

                // determine previous file name from the entity so we can remove it after successful save
                string? previousFileName = null;
                Func<Task>? applyEntityUpdate = null;

                switch (entityFolder)
                {
                    case "BusinessPartner":
                    {
                        var businessPartner = await _businessPartnerRepository.GetByIdAsync(
                            entityId
                        );
                        previousFileName = businessPartner?.Photo ?? string.Empty;
                        RemovePhotoWhenFileIsEmpty(
                            file,
                            uploadsRoot,
                            entityFolder,
                            previousFileName
                        );
                        if (businessPartner != null)
                        {
                            businessPartner.Photo = fileName;
                            await _businessPartnerRepository.UpdateAsync(businessPartner);
                        }
                        break;
                    }
                    case "User":
                    {
                        var user = await _userRepository.GetByIdAsync(entityId.ToString());
                        previousFileName = user?.Photo ?? string.Empty;
                        RemovePhotoWhenFileIsEmpty(
                            file,
                            uploadsRoot,
                            entityFolder,
                            previousFileName
                        );
                        if (user != null)
                        {
                            user.Photo = fileName;
                            await _userRepository.UpdateAsync(user);
                        }
                        break;
                    }
                    case "Product":
                    {
                        var product = await _productRepository.GetByIdAsync(entityId);
                        previousFileName = product?.Photo ?? string.Empty;
                        RemovePhotoWhenFileIsEmpty(
                            file,
                            uploadsRoot,
                            entityFolder,
                            previousFileName
                        );
                        if (product != null)
                        {
                            product.Photo = fileName;
                            await _productRepository.UpdateAsync(product);
                        }
                        break;
                    }
                }

                // Earlier exit when file was removed
                if (file == null)
                {
                    return string.Empty;
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

                // Delete previous file permanently if it exists and is different from the new one
                if (
                    !string.IsNullOrWhiteSpace(previousFileName)
                    && !string.Equals(
                        previousFileName,
                        fileName,
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    RemovePhotoWhenFileIsEmpty(file, uploadsRoot, entityFolder, previousFileName);
                }

                return fileName;
            }
            catch (Exception ex)
            {
                throw new Exception(ex.Message);
                //return string.Empty;
            }
        }

        #endregion Public methods

        #region Private methods

        private static void RemovePhotoWhenFileIsEmpty(
            IFormFile? file,
            string uploadsRoot,
            string entityFolder,
            string previousFileName
        )
        {
            if (file == null)
            {
                var previousPath = Path.Combine(uploadsRoot, entityFolder, previousFileName);
                if (File.Exists(previousPath))
                {
                    try
                    {
                        File.Delete(previousPath);
                    }
                    catch
                    {
                        // ignore deletion errors to avoid breaking the upload process
                    }
                }
            }
        }

        #endregion Private methos
    }
}
