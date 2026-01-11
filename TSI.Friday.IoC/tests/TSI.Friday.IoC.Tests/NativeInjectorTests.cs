using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.IoC.Tests
{
    public class NativeInjectorTests
    {
        [Fact]
        public void NativeInjector_RegisterServices_AddsExpectedServicesAndRepositories()
        {
            // Arrange
            var services = new ServiceCollection();

            // Act
            NativeInjector.RegisterServices(services);
            using var provider = services.BuildServiceProvider();

            // Assert
            provider.GetService<IOrderService>().Should().NotBeNull();
            provider.GetService<IOrderProductService>().Should().NotBeNull();
            provider.GetService<IPaymentService>().Should().NotBeNull();
            provider.GetService<IClientService>().Should().NotBeNull();
            provider.GetService<IAddressService>().Should().NotBeNull();
            provider.GetService<IMapper>().Should().NotBeNull();
            provider.GetService<IRepository<Order>>().Should().NotBeNull();
            provider.GetService<IRepository<OrderProduct>>().Should().NotBeNull();
            provider.GetService<IRepository<Payment>>().Should().NotBeNull();
        }
    }
}
