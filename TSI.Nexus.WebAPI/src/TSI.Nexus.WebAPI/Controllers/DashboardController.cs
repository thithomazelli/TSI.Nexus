using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;

namespace TSI.Nexus.WebAPI.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : Controller
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet]
        [Route("GetInfoCards/{days}")]
        public async Task<IActionResult> GetInfoCards(int days)
        {
            var result = await _dashboardService.GetInfoCardsAsync(days);
            return Ok(result);
        }
    }
}
