using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class FeatureToggleTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var toggle = new FeatureToggle
            {
                Key = "FleetModule",
                Name = "Frota",
                Description = "Módulo de gestão de frota",
                Enabled = true,
                GroupKey = null,
            };

            toggle.Key.Should().Be("FleetModule");
            toggle.Name.Should().Be("Frota");
            toggle.Description.Should().Be("Módulo de gestão de frota");
            toggle.Enabled.Should().BeTrue();
            toggle.GroupKey.Should().BeNull();
        }

        [Fact]
        public void GroupKey_CanBeSetForEntityLevelToggles()
        {
            var toggle = new FeatureToggle { GroupKey = "FleetModule" };

            toggle.GroupKey.Should().Be("FleetModule");
        }

        [Fact]
        public void DefaultConstructor_LeavesDefaultsIntact()
        {
            var toggle = new FeatureToggle();

            toggle.Key.Should().BeEmpty();
            toggle.Name.Should().BeEmpty();
            toggle.Description.Should().BeEmpty();
            toggle.Enabled.Should().BeFalse();
        }
    }
}
