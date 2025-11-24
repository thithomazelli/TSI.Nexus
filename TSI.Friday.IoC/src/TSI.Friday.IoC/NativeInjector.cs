using Microsoft.Extensions.DependencyInjection;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Repository;
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
            #region Services
            
            services.AddScoped<IJwtService, JwtService>();
            services.AddScoped<IUserManagerService, UserManagerService>();
            services.AddScoped<IEmailService, EmailService>();
            services.AddScoped<IAddressService, AddressService>();
            services.AddScoped<ICompanyService, CompanyService>();
            services.AddScoped<IIndividualService, IndividualService>();
            services.AddScoped<IProductService, ProductService>();

            #endregion Services

            #region Repositories

            services.AddScoped<IRepository<Address>, Repository<Address>>();
            services.AddScoped<IRepository<Company>, Repository<Company>>();
            services.AddScoped<IRepository<Individual>, Repository<Individual>>();
            services.AddScoped<IRepository<Product>, Repository<Product>>();

            #endregion Repositories
        }
    }
}
