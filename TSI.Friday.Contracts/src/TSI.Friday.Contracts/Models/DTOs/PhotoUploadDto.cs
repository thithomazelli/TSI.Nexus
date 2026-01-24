using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class PhotoUploadDto
    {
        public string Entity { get; set; }

        public int EntityId { get; set; }

        public IFormFile File { get; set; }
    }
}
