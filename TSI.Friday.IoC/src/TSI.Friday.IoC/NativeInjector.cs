using AutoMapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data.Interceptors;
using TSI.Friday.Repository;
using TSI.Friday.Repository.Overdue;
using TSI.Friday.Services;
using TSI.Friday.Services.Services;

namespace TSI.Friday.IoC
{
    public static class NativeInjector
    {
        /// <summary>
        /// This method will be responsible to configure the dependency injections for every service class add on this project.
        /// </summary>
        /// <param name="services">Service collection received when the startup is executed</param>
        public static void RegisterServices(IServiceCollection services)
        {
            #region Mapping Profiles

            // Manual registration of AutoMapper without relying on AutoMapper.Extensions.Microsoft.DependencyInjection
            services.AddSingleton(sp =>
            {
                var loggerFactory = sp.GetRequiredService<ILoggerFactory>();
                var config = new MapperConfiguration(
                    cfg =>
                    {
                        cfg.ConstructServicesUsing(type => sp.GetService(type));
                        cfg.AddMaps(typeof(MappingProfile).Assembly); // escaneia todos os Profiles do assembly
                    },
                    loggerFactory
                );

                // opcional em ambiente de dev: config.AssertConfigurationIsValid();
                return config.CreateMapper(sp.GetService);
            });

            #endregion

            #region Infrastructure Services

            // IHttpContextAccessor is needed by CurrentUserService
            services.AddHttpContextAccessor();

            // CurrentUserService depends only on IHttpContextAccessor and can be registered as singleton
            // so interceptors (registered as singleton) can consume it when DbContext is being configured.
            services.AddSingleton<ICurrentUserService, CurrentUserService>();

            // Register EF interceptors as singletons so they can be requested from the root provider
            // during AddDbContextPool configuration without causing scoped->singleton captive dependency.
            services.AddSingleton<AuditingSaveChangesInterceptor>();
            services.AddSingleton<StockAdjustingSaveChangesInterceptor>();

            #endregion

            #region Services
            // register repository and service for overdue
            services.AddScoped<IOverdueRepository, OverdueRepository>();
            services.AddScoped<IOverdueService, OverdueService>();
            // register hosted service
            services.AddHostedService<OverdueStatusBackgroundService>();

            services.AddScoped<IAddressService, AddressService>();
            services.AddScoped<IAttachmentService, AttachmentService>();
            services.AddScoped<IBusinessPartnerService, BusinessPartnerService>();
            services.AddScoped<ICompanyService, CompanyService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IIndividualService, IndividualService>();
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IOrderProductService, OrderProductService>();
            services.AddScoped<IOrderService, OrderService>();
            services.AddScoped<ITransactionService, TransactionService>();
            services.AddScoped<IPaymentService, PaymentService>();
            services.AddScoped<IPhotoService, PhotoService>();
            services.AddScoped<IProductPhotoService, ProductPhotoService>();
            services.AddScoped<ILogService, LogService>();
            services.AddScoped<IProductService, ProductService>();
            services.AddScoped<IQuoteService, QuoteService>();
            services.AddScoped<IQuoteProductService, QuoteProductService>();
            services.AddScoped<IUserManagerService, UserManagerService>();
            services.AddScoped<ISequenceService, SequenceService>();
            services.AddScoped<IDashboardService, DashboardService>();

            #endregion Services

            #region Repositories

            services.AddScoped<IRepository<Address>, Repository<Address>>();
            services.AddScoped<IRepository<Attachment>, Repository<Attachment>>();
            services.AddScoped<IRepository<BusinessPartner>, Repository<BusinessPartner>>();
            services.AddScoped<IRepository<Company>, Repository<Company>>();
            services.AddScoped<IRepository<Individual>, Repository<Individual>>();
            services.AddScoped<IRepository<Order>, Repository<Order>>();
            services.AddScoped<IRepository<OrderProduct>, Repository<OrderProduct>>();
            services.AddScoped<IRepository<Transaction>, Repository<Transaction>>();
            services.AddScoped<IRepository<Payment>, Repository<Payment>>();
            services.AddScoped<IRepository<Product>, Repository<Product>>();
            services.AddScoped<IRepository<ProductPhoto>, Repository<ProductPhoto>>();
            services.AddScoped<IRepository<Quote>, Repository<Quote>>();
            services.AddScoped<IRepository<QuoteProduct>, Repository<QuoteProduct>>();
            services.AddScoped<IRepository<User>, Repository<User>>();
            services.AddScoped<IRepository<Sequence>, Repository<Sequence>>();

            #endregion Repositories
        }
    }
}
