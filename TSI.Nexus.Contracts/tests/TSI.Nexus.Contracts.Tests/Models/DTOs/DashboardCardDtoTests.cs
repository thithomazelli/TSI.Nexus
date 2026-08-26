using FluentAssertions;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class DashboardCardDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var dto = new DashboardCardDto { Title = "Total de vendas", Value = "R$ 10.000,00" };

            dto.Title.Should().Be("Total de vendas");
            dto.Value.Should().Be("R$ 10.000,00");
        }
    }
}
