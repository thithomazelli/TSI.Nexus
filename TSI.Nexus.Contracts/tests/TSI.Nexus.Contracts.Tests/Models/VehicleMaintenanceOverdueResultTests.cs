using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class VehicleMaintenanceOverdueResultTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var result = new VehicleMaintenanceOverdueResult
            {
                MaintenancesUpdated = 3,
                VehiclesBlocked = 1,
            };

            result.MaintenancesUpdated.Should().Be(3);
            result.VehiclesBlocked.Should().Be(1);
        }
    }
}
