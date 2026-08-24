using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;

[ApiController]
[Route("api/[controller]")]
public class PhotosController : ControllerBase
{
    private readonly IPhotoService _photoService;

    public PhotosController(IPhotoService photoService)
    {
        _photoService = photoService;
    }

    [HttpPost("UploadPhoto")]
    [Authorize]
    public async Task<IActionResult> UploadPhoto(
        [FromForm] string entity,
        [FromForm] Guid entityId,
        [FromForm] IFormFile file
    )
    {
        var fileName = await _photoService.UploadImageAsync(entity, entityId, file);
        return Ok(new { message = "Photo uploaded", fileName });
    }

    [HttpGet("GetPhoto")]
    [Authorize]
    public IActionResult GetPhoto(
        [FromQuery] string entity,
        [FromQuery] Guid entityId,
        [FromQuery] string fileName
    )
    {
        var response = _photoService.GetPhotoFile(entity, entityId, fileName);

        if (response.Status != ResponseStatus.Success || response.Data == null)
            return NotFound(response.Message);

        return File(response.Data.Stream, response.Data.ContentType, response.Data.FileName);
    }
}
