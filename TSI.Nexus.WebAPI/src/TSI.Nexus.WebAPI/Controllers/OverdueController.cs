using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.WebAPI.Controllers
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
        [Authorize(Roles = "Admin,Master")]
        public async Task<ActionResult<OverdueResult>> Run()
        {
            var result = await _overdueService.RunOverdueUpdateAsync();
            return Ok(result);
        }
    }
}
