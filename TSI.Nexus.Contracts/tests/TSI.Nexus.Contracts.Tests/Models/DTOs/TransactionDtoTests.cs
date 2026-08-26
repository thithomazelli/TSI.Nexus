using System;
using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class TransactionDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var id = Guid.NewGuid();
            var orderId = Guid.NewGuid();
            var purchaseOrderId = Guid.NewGuid();
            var tripId = Guid.NewGuid();
            var businessPartnerId = Guid.NewGuid();
            var createDate = DateTime.UtcNow.AddDays(-1);
            var modifyDate = DateTime.UtcNow;
            var date = DateTime.UtcNow;
            var payments = new List<PaymentDto> { new PaymentDto() };

            var dto = new TransactionDto
            {
                Id = id,
                CreateDate = createDate,
                CreateUserId = "creator",
                ModifyDate = modifyDate,
                ModifyUserId = "modifier",
                Date = date,
                Category = "Vendas",
                Description = "Venda de produto",
                TotalOfPayments = 2,
                PaymentTotalPrice = 500m,
                TotalOfExpenses = 1,
                ExpenseTotalPrice = 100m,
                Type = PaymentType.Incoming,
                Status = PaymentStatus.Approved,
                Condition = PaymentCondition.FullPayment,
                Method = PaymentMethod.Pix,
                OrderId = orderId,
                OrderNumber = "ORD-001",
                PurchaseOrderId = purchaseOrderId,
                TripId = tripId,
                TripNumber = "TRIP-001",
                BusinessPartnerId = businessPartnerId,
                BusinessPartnerName = "Cliente X",
                HasOpenedPayments = true,
                MarkAllPaymentsAsApproved = false,
                Payments = payments,
            };

            dto.Id.Should().Be(id);
            dto.CreateDate.Should().Be(createDate);
            dto.CreateUserId.Should().Be("creator");
            dto.ModifyDate.Should().Be(modifyDate);
            dto.ModifyUserId.Should().Be("modifier");
            dto.Date.Should().Be(date);
            dto.Category.Should().Be("Vendas");
            dto.Description.Should().Be("Venda de produto");
            dto.TotalOfPayments.Should().Be(2);
            dto.PaymentTotalPrice.Should().Be(500m);
            dto.TotalOfExpenses.Should().Be(1);
            dto.ExpenseTotalPrice.Should().Be(100m);
            dto.Type.Should().Be(PaymentType.Incoming);
            dto.Status.Should().Be(PaymentStatus.Approved);
            dto.Condition.Should().Be(PaymentCondition.FullPayment);
            dto.Method.Should().Be(PaymentMethod.Pix);
            dto.OrderId.Should().Be(orderId);
            dto.OrderNumber.Should().Be("ORD-001");
            dto.PurchaseOrderId.Should().Be(purchaseOrderId);
            dto.TripId.Should().Be(tripId);
            dto.TripNumber.Should().Be("TRIP-001");
            dto.BusinessPartnerId.Should().Be(businessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente X");
            dto.HasOpenedPayments.Should().BeTrue();
            dto.MarkAllPaymentsAsApproved.Should().BeFalse();
            dto.Payments.Should().BeSameAs(payments);
        }

        [Fact]
        public void Payments_DefaultsToEmptyCollection()
        {
            var dto = new TransactionDto();

            dto.Payments.Should().NotBeNull().And.BeEmpty();
        }
    }
}
