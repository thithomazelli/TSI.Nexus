using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.WebAPI.Controllers
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
        [Route("GetInfoCards")]
        public async Task<IActionResult> GetInfoCards()
        {
            var result = await _dashboardService.GetInfoCardsAsync();
            return Ok(result);
        }
    }
}
