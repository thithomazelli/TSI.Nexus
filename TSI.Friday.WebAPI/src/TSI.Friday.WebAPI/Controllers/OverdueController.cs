using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OverdueController : ControllerBase
    {
        private readonly IOverdueService _overdueService;

        public OverdueController(IOverdueService overdueService)
        {
            _overdueService = overdueService;
        }

        [HttpPost("run")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<OverdueResult>> Run()
        {
            var result = await _overdueService.RunOverdueUpdateAsync();
            return Ok(result);
        }
    }
}
