using System;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class TripDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var transactionId = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-2);
            var modifyDate = DateTime.UtcNow;
            var date = DateTime.UtcNow;
            var licenseExpiryDate = DateTime.UtcNow.AddYears(1);
            var transaction = new TransactionDto();

            var dto = new TripDto
            {
                Id = id,
                TripNumber = "TRIP-001",
                Date = date,
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                Status = OrderStatus.Open,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Discount = 100m,
                Price = 1500m,
                TotalPrice = 1400m,
                Route = "SP -> RJ",
                DistanceKm = 450m,
                DailyCount = 2,
                TransportLicenseNumber = "TL-1",
                TransportLicenseExpiryDate = licenseExpiryDate,
                VehicleId = vehicleId,
                VehiclePlate = "ABC-1234",
                DriverId = driverId,
                DriverName = "Carlos",
                QuoteNumber = "QUO-001",
                TransactionId = transactionId,
                Transaction = transaction,
            };

            dto.Id.Should().Be(id);
            dto.TripNumber.Should().Be("TRIP-001");
            dto.Date.Should().Be(date);
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.Status.Should().Be(OrderStatus.Open);
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Discount.Should().Be(100m);
            dto.Price.Should().Be(1500m);
            dto.TotalPrice.Should().Be(1400m);
            dto.Route.Should().Be("SP -> RJ");
            dto.DistanceKm.Should().Be(450m);
            dto.DailyCount.Should().Be(2);
            dto.TransportLicenseNumber.Should().Be("TL-1");
            dto.TransportLicenseExpiryDate.Should().Be(licenseExpiryDate);
            dto.VehicleId.Should().Be(vehicleId);
            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.DriverId.Should().Be(driverId);
            dto.DriverName.Should().Be("Carlos");
            dto.QuoteNumber.Should().Be("QUO-001");
            dto.TransactionId.Should().Be(transactionId);
            dto.Transaction.Should().BeSameAs(transaction);
        }

        [Fact]
        public void Route_DefaultsToEmpty()
        {
            var dto = new TripDto();

            dto.Route.Should().BeEmpty();
        }
    }
}
