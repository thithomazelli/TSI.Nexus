using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class PhotosController : ControllerBase
{
    /// <summary>
    /// PhotoService object created to access the service model.
    /// </summary>
    private readonly IPhotoService _photoService;

    /// <summary>
    /// ProductPhotosController constructor create to initialize the "_productPhotoService" using Dependency Injection.
    /// </summary>
    /// <param name="productPhotoService ">IProductPhotoService object used to initialize the internal variable using Dependency Injection.</param>
    public PhotosController(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpPost]
    [Route("UploadPhoto")]
    public async Task<IActionResult> UploadPhoto(
        [FromForm] string entity,
        [FromForm] string entityId,
        [FromForm] IFormFile file
    )
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("No file uploaded.");
        }

        var fileName = await _photoService.UploadImageAsync(entity, entityId, file);

        return Ok(new { message = "Photo uploaded", fileName });
    }
}
