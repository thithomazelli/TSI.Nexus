using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class AlertConfigTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();

            var alertConfig = new AlertConfig
            {
                Id = id,
                Key = "vehicle_maintenance_due",
                Name = "Manutenção prestes a vencer",
                Description = "Alerta quando a manutenção está próxima do vencimento",
                Enabled = false,
                ThresholdDays = 7,
            };

            alertConfig.Id.Should().Be(id);
            alertConfig.Key.Should().Be("vehicle_maintenance_due");
            alertConfig.Name.Should().Be("Manutenção prestes a vencer");
            alertConfig.Description.Should().Be("Alerta quando a manutenção está próxima do vencimento");
            alertConfig.Enabled.Should().BeFalse();
            alertConfig.ThresholdDays.Should().Be(7);
        }

        [Fact]
        public void Defaults_MatchDeclaredValues()
        {
            var alertConfig = new AlertConfig();

            alertConfig.Key.Should().BeEmpty();
            alertConfig.Name.Should().BeEmpty();
            alertConfig.Description.Should().BeEmpty();
            alertConfig.Enabled.Should().BeTrue();
            alertConfig.ThresholdDays.Should().BeNull();
        }
    }
}
