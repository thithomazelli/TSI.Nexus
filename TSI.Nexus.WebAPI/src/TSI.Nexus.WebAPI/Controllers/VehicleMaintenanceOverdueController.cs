using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VehicleMaintenanceOverdueController : ControllerBase
    {
        private readonly IVehicleMaintenanceOverdueService _vehicleMaintenanceOverdueService;

        public VehicleMaintenanceOverdueController(
            IVehicleMaintenanceOverdueService vehicleMaintenanceOverdueService
        )
        {
            _vehicleMaintenanceOverdueService = vehicleMaintenanceOverdueService;
        }

        [HttpPost("run")]
        [Authorize(Roles = "Admin,Master")]
        public async Task<ActionResult<VehicleMaintenanceOverdueResult>> Run()
        {
            var result = await _vehicleMaintenanceOverdueService.RunOverdueUpdateAsync();
            return Ok(result);
        }
    }
}
