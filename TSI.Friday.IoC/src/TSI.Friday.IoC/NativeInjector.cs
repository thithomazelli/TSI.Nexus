using Microsoft.Extensions.DependencyInjection;
using TSI.Friday.Contracts.Interfaces;
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

            #endregion Services

            #region Repositories

            //services.AddScoped<IRepository<Person>, Repository<Person>>();

            #endregion Repositories
        }
    }
}
