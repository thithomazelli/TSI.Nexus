using FluentAssertions;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class OverdueResultTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var result = new OverdueResult { PaymentsUpdated = 5 };

            result.PaymentsUpdated.Should().Be(5);
        }
    }
}
