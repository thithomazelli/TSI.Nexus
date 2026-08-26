using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class CommissionTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var serviceOrder = new ServiceOrder();
            var driver = new Driver();
            var serviceOrderId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var paidDate = DateTime.UtcNow;

            var commission = new Commission
            {
                Percentage = 10m,
                BaseAmount = 1000m,
                Amount = 100m,
                Status = CommissionStatus.Paid,
                PaidDate = paidDate,
                ServiceOrderId = serviceOrderId,
                ServiceOrder = serviceOrder,
                DriverId = driverId,
                Driver = driver,
            };

            commission.Percentage.Should().Be(10m);
            commission.BaseAmount.Should().Be(1000m);
            commission.Amount.Should().Be(100m);
            commission.Status.Should().Be(CommissionStatus.Paid);
            commission.PaidDate.Should().Be(paidDate);
            commission.ServiceOrderId.Should().Be(serviceOrderId);
            commission.ServiceOrder.Should().BeSameAs(serviceOrder);
            commission.DriverId.Should().Be(driverId);
            commission.Driver.Should().BeSameAs(driver);
        }

        [Fact]
        public void PaidDate_DefaultsToNull()
        {
            var commission = new Commission();

            commission.PaidDate.Should().BeNull();
        }
    }
}
