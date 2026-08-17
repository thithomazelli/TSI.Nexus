using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttachmentsController : ControllerBase
    {
        private readonly IAttachmentService _attachmentService;

        public AttachmentsController(IAttachmentService attachmentService)
        {
            _attachmentService = attachmentService;
        }

        [HttpPost("Add")]
        [Authorize]
        public async Task<ActionResult<WebApiResponse<AttachmentResponseDto>>> Add(
            [FromForm] AttachmentDto dto,
            [FromForm] string overridePath
        )
        {
            return await _attachmentService.Add(dto, overridePath);
        }

        [HttpPut("Update")]
        [Authorize]
        public async Task<ActionResult<WebApiResponse<AttachmentResponseDto>>> Update(
            [FromForm] AttachmentDto dto,
            [FromForm] string overridePath
        )
        {
            return await _attachmentService.Update(dto, overridePath);
        }

        [HttpDelete("Delete/{id}")]
        [Authorize]
        public async Task<ActionResult<WebApiResponse<AttachmentResponseDto>>> Delete(Guid id)
        {
            return await _attachmentService.Delete(id);
        }

        [HttpGet("GetById/{id}")]
        [Authorize]
        public async Task<ActionResult<WebApiResponse<AttachmentResponseDto>>> GetById(Guid id)
        {
            return await _attachmentService.GetById(id);
        }

        [HttpGet("GetFileById/{id}")]
        [Authorize]
        public async Task<IActionResult> GetFileById(Guid id)
        {
            var response = await _attachmentService.GetFileById(id);

            if (response.Status != ResponseStatus.Success || response.Data == null)
                return NotFound(response.Message);

            return File(response.Data.Stream, response.Data.ContentType, response.Data.FileName);
        }

        [HttpGet("GetByBusinessPartnerId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByBusinessPartnerId(Guid id)
        {
            return await _attachmentService.GetByBusinessPartnerId(id);
        }

        [HttpGet("GetByOrderId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByOrderId(Guid id)
        {
            return await _attachmentService.GetByOrderId(id);
        }

        [HttpGet("GetByTripId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByTripId(Guid id)
        {
            return await _attachmentService.GetByTripId(id);
        }

        [HttpGet("GetByTransactionId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByTransactionId(Guid id)
        {
            return await _attachmentService.GetByTransactionId(id);
        }

        [HttpGet("GetByPaymentId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByPaymentId(Guid id)
        {
            return await _attachmentService.GetByPaymentId(id);
        }

        [HttpGet("GetByProductId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByProductId(Guid id)
        {
            return await _attachmentService.GetByProductId(id);
        }

        [HttpGet("GetByUserId/{id}")]
        [Authorize]
        public async Task<
            ActionResult<
                WebApiResponse<System.Collections.Generic.IEnumerable<AttachmentResponseDto>>
            >
        > GetByUserId(string id)
        {
            return await _attachmentService.GetByUserId(id);
        }
    }
}
