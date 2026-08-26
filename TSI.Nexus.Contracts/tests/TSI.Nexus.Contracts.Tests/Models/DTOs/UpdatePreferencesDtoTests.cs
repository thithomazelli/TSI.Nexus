using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class UpdatePreferencesDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new UpdatePreferencesDto { Theme = "dark", Language = "en" };

            dto.Theme.Should().Be("dark");
            dto.Language.Should().Be("en");
        }
    }
}
