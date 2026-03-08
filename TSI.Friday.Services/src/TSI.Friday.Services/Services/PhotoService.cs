using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
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
        private readonly IConfiguration _configuration;

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
            IRepository<User> userRepository,
            IConfiguration configuration
        )
        {
            _env = env ?? throw new ArgumentNullException(nameof(env));
            _businessPartnerRepository =
                businessPartnerRepository
                ?? throw new ArgumentNullException(nameof(businessPartnerRepository));
            _productRepository =
                productRepository ?? throw new ArgumentNullException(nameof(productRepository));
            _userRepository =
                userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _configuration =
                configuration ?? throw new ArgumentNullException(nameof(configuration));
        }

        private static string? FindWorkspaceRoot(string startPath)
        {
            try
            {
                var dir = new DirectoryInfo(startPath);
                while (dir != null && dir.FullName != dir.Root.FullName)
                {
                    if (
                        Directory.Exists(Path.Combine(dir.FullName, ".git"))
                        || dir.GetFiles("*.sln").Any()
                        || string.Equals(dir.Name, "TSI.Friday", StringComparison.OrdinalIgnoreCase)
                    )
                    {
                        return dir.FullName;
                    }

                    dir = dir.Parent;
                }
            }
            catch
            {
                // ignore and fallback
            }

            return null;
        }

        /// <inheritdoc />
        public async Task<string> UploadImageAsync(
            string entityFolder,
            Guid entityId,
            IFormFile? file
        )
        {
            // Basic validations
            var allowedExts = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            const long maxBytes = 5 * 1024 * 1024; // 5 MB

            // Resolve uploads root: configuration > workspace-root (dev) > ContentRoot (server)
            var configuredUploads = _configuration["Uploads:Path"]; // may be null or empty
            string uploadsRoot;

            if (!string.IsNullOrWhiteSpace(configuredUploads))
            {
                uploadsRoot = Path.IsPathRooted(configuredUploads)
                    ? Path.GetFullPath(configuredUploads)
                    : Path.GetFullPath(Path.Combine(_env.ContentRootPath, configuredUploads));
            }
            else
            {
                var workspaceRoot = FindWorkspaceRoot(_env.ContentRootPath);
                if (!string.IsNullOrWhiteSpace(workspaceRoot))
                {
                    uploadsRoot = Path.GetFullPath(Path.Combine(workspaceRoot, "uploads"));
                }
                else
                {
                    // fallback to ContentRootPath/uploads for server when workspace not found
                    uploadsRoot = Path.GetFullPath(Path.Combine(_env.ContentRootPath, "uploads"));
                }
            }

            Directory.CreateDirectory(uploadsRoot);
            var dirPath = Path.Combine(uploadsRoot, entityFolder);
            Directory.CreateDirectory(dirPath);

            // If file == null -> remove existing photo for entity
            if (file == null)
            {
                string? previousFileName = null;
                switch (entityFolder)
                {
                    case "BusinessPartner":
                    {
                        var bp = await _businessPartnerRepository.GetByIdAsync(entityId);
                        previousFileName = bp?.Photo ?? string.Empty;
                        if (bp != null)
                        {
                            bp.Photo = null;
                            await _businessPartnerRepository.UpdateAsync(bp);
                        }

                        break;
                    }
                    case "User":
                    {
                        var user = await _userRepository.GetByIdAsync(entityId.ToString());
                        previousFileName = user?.Photo ?? string.Empty;
                        if (user != null)
                        {
                            user.Photo = null;
                            await _userRepository.UpdateAsync(user);
                        }

                        break;
                    }
                    case "Product":
                    {
                        var product = await _productRepository.GetByIdAsync(entityId);
                        previousFileName = product?.Photo ?? string.Empty;
                        if (product != null)
                        {
                            product.Photo = null;
                            await _productRepository.UpdateAsync(product);
                        }

                        break;
                    }
                    default:
                        throw new ArgumentException("Unknown entity folder", nameof(entityFolder));
                }

                if (!string.IsNullOrWhiteSpace(previousFileName))
                {
                    var previousPath = Path.Combine(dirPath, previousFileName);
                    if (File.Exists(previousPath))
                    {
                        try
                        {
                            File.Delete(previousPath);
                        }
                        catch
                        { /* ignore */
                        }
                    }
                }

                return string.Empty;
            }

            // Validate provided file
            var ext = Path.GetExtension(file.FileName)?.ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(ext) || !allowedExts.Contains(ext))
                throw new ArgumentException("Unsupported file extension");

            if (file.Length > maxBytes)
                throw new ArgumentException("File too large");

            // Prepare names and paths
            var fileName = $"{Guid.NewGuid()}{ext}";
            var tempFileName = fileName + ".tmp";
            var tempPath = Path.Combine(dirPath, tempFileName);
            var finalPath = Path.Combine(dirPath, fileName);

            // Save to temp
            using (var stream = new FileStream(tempPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update entity in DB and capture previous file
            string? previousFile = null;
            switch (entityFolder)
            {
                case "BusinessPartner":
                {
                    var bp = await _businessPartnerRepository.GetByIdAsync(entityId);
                    previousFile = bp?.Photo ?? string.Empty;
                    if (bp != null)
                    {
                        bp.Photo = fileName;
                        await _businessPartnerRepository.UpdateAsync(bp);
                    }

                    break;
                }
                case "User":
                {
                    var user = await _userRepository.GetByIdAsync(entityId.ToString());
                    previousFile = user?.Photo ?? string.Empty;
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
                    previousFile = product?.Photo ?? string.Empty;
                    if (product != null)
                    {
                        product.Photo = fileName;
                        await _productRepository.UpdateAsync(product);
                    }

                    break;
                }
                default:
                    throw new ArgumentException("Unknown entity folder", nameof(entityFolder));
            }

            // Move temp to final (atomic on same volume)
            File.Move(tempPath, finalPath);

            // Delete previous file if exists and different
            if (
                !string.IsNullOrWhiteSpace(previousFile)
                && !string.Equals(previousFile, fileName, StringComparison.OrdinalIgnoreCase)
            )
            {
                var previousPath = Path.Combine(dirPath, previousFile);
                if (File.Exists(previousPath))
                {
                    try
                    {
                        File.Delete(previousPath);
                    }
                    catch
                    { /* ignore */
                    }
                }
            }

            return fileName;
        }

        #endregion Public methods

        #region Private methods

        // kept for compatibility with previous behavior (not used now)
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
