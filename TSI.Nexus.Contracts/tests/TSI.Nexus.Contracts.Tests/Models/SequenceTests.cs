using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class SequenceTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var sequence = new Sequence { Name = "OrderNumber", NextVal = 1001L };

            sequence.Name.Should().Be("OrderNumber");
            sequence.NextVal.Should().Be(1001L);
        }
    }
}
