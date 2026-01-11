using AutoMapper;
using FluentAssertions;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.IoC.Tests
{
    public class MappingProfileTests
    {
        [Fact]
        public void MappingProfile_AutoMapper_Configuration_IsValid()
        {
            // Arrange
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());

            // Act / Assert
            config.AssertConfigurationIsValid();
        }

        [Fact]
        public void MappingProfile_Order_To_OrderDto_Maps_TotalPrice()
        {
            // Arrange
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            var mapper = config.CreateMapper();

            var order = new Order
            {
                Id =1,
                OrderNumber = "ORD-001",
                OrderProducts = new List<OrderProduct>
                {
                    new() { Price =10m, Quantity =2m, Discount =0m }, //20
                    new() { Price =5m, Quantity =3m, Discount =10m } // (15) -10% =13.5
                }
            };

            var expectedTotal =20m +13.5m;

            // Act
            var dto = mapper.Map<OrderDto>(order);

            // Assert
            dto.TotalPrice.Should().BeApproximately(expectedTotal,0.0001m);
        }
    }
}
