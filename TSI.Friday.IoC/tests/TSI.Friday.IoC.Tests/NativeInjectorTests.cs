using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.IoC.Tests
{
    public class NativeInjectorTests
    {
        [Fact]
        public void NativeInjector_RegisterServices_AddsExpectedServices()
        {
            // Arrange
            var services = new ServiceCollection();

            // Act
            NativeInjector.RegisterServices(services);

            // Assert - check registrations without resolving instances
            services.Any(sd => sd.ServiceType == typeof(IAddressService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IBusinessPartnerService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ICompanyService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IEmailService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IIndividualService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IJwtService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IOrderProductService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IOrderService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPaymentService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IPaymentInstallmentService))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPhotoService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IProductPhotoService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IProductService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IUserManagerService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ISequenceService)).Should().BeTrue();
        }

        [Fact]
        public void NativeInjector_RegisterServices_AddsExpectedRepositories()
        {
            // Arrange
            var services = new ServiceCollection();

            // Act
            NativeInjector.RegisterServices(services);

            // Assert
            services.Any(sd => sd.ServiceType == typeof(IRepository<Address>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<BusinessPartner>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Company>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Individual>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Order>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<OrderProduct>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Payment>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<PaymentInstallment>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Product>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<ProductPhoto>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<User>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Sequence>)).Should().BeTrue();
        }
    }
}
