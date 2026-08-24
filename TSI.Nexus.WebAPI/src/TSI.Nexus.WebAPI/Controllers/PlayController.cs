using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]

    public class PlayController : Controller
    {
        [HttpGet("get-players")]
        public async Task<IActionResult> Players()
        {
            return Ok(new JsonResult(new { message = "Only authorized users can view players"}));
        }
    }
}
