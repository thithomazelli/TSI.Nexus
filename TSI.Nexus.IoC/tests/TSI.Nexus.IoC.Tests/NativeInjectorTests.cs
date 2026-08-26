using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Repository.Overdue;

namespace TSI.Nexus.IoC.Tests
{
    public class NativeInjectorTests
    {
        [Fact]
        public void RegisterServices_ConfiguresMapperFactory_ResolvesIMapper()
        {
            // Arrange - the AutoMapper registration in NativeInjector uses a factory lambda that
            // only runs once IMapper is actually resolved from a built provider, so a mere
            // registration check (as the other tests here do) never exercises it.
            var services = new ServiceCollection();
            services.AddLogging();

            NativeInjector.RegisterServices(services);

            using var provider = services.BuildServiceProvider();

            // Act
            var mapper = provider.GetRequiredService<IMapper>();

            // Assert
            mapper.Should().NotBeNull();
            mapper.ConfigurationProvider.Should().NotBeNull();
        }

        [Fact]
        public void RegisterServices_RegistersOverdueAndVehicleMaintenanceOverdueServices()
        {
            var services = new ServiceCollection();

            NativeInjector.RegisterServices(services);

            services.Any(sd => sd.ServiceType == typeof(IOverdueRepository)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IOverdueService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IVehicleMaintenanceOverdueService))
                .Should()
                .BeTrue();
        }

        [Fact]
        public void RegisterServices_RegistersInfrastructureAndInterceptorServices()
        {
            var services = new ServiceCollection();

            NativeInjector.RegisterServices(services);

            services.Any(sd => sd.ServiceType == typeof(ICurrentUserService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType.Name == "AuditingSaveChangesInterceptor")
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType.Name == "StockAdjustingSaveChangesInterceptor")
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType.Name == "MaintenancePartsStockAdjustingSaveChangesInterceptor")
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType.Name == "PurchaseOrderStockIncrementingSaveChangesInterceptor")
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType.Name == "FuelLogStockAdjustingSaveChangesInterceptor")
                .Should()
                .BeTrue();
        }

        [Fact]
        public void RegisterServices_RegistersRemainingDomainServicesNotCoveredByOtherTests()
        {
            var services = new ServiceCollection();

            NativeInjector.RegisterServices(services);

            services.Any(sd => sd.ServiceType == typeof(IAttachmentService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPurchaseOrderProductService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPurchaseOrderService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ITripService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ITripDriverService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ILogService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IQuoteService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IQuoteProductService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IDashboardService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IVehicleMaintenanceProductService))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ITripLegService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IQuoteTripLegService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPassengerService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IFuelLogService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IServiceOrderService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ICommissionService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IDocumentTemplateService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IFeatureToggleService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IAlertConfigService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ISelectableOptionService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IEventService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IEventParticipantService)).Should().BeTrue();
        }

        [Fact]
        public void RegisterServices_RegistersRemainingRepositoriesNotCoveredByOtherTests()
        {
            var services = new ServiceCollection();

            NativeInjector.RegisterServices(services);

            services.Any(sd => sd.ServiceType == typeof(IRepository<Attachment>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<TripDriver>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<QuoteTrip>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<DocumentTemplate>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<FeatureToggle>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<AlertConfig>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<SelectableOption>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Event>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<EventParticipant>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Quote>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<QuoteProduct>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<TripLeg>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<QuoteTripLeg>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Passenger>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<FuelLog>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<ServiceOrder>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Commission>)).Should().BeTrue();
        }

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
            services.Any(sd => sd.ServiceType == typeof(ITransactionService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IPaymentService))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IPhotoService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IProductPhotoService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IProductService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IUserManagerService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(ISequenceService)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IVehicleService)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IVehicleMaintenanceService))
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IVehicleMaintenanceOverdueService))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IDriverService)).Should().BeTrue();
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
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<Transaction>))
                .Should()
                .BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<Payment>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Product>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<ProductPhoto>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<User>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Sequence>)).Should().BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Vehicle>)).Should().BeTrue();
            services
                .Any(sd => sd.ServiceType == typeof(IRepository<VehicleMaintenance>))
                .Should()
                .BeTrue();
            services.Any(sd => sd.ServiceType == typeof(IRepository<Driver>)).Should().BeTrue();
        }
    }
}
