using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IServiceOrderService
    {
        Task<WebApiResponse<ServiceOrder>> Add(ServiceOrder serviceOrder);

        Task<WebApiResponse<ServiceOrder>> Update(ServiceOrder serviceOrder);

        Task<WebApiResponse<ServiceOrder>> Remove(ServiceOrder serviceOrder);

        Task<WebApiResponse<ServiceOrder>> FindById(Guid? id);

        Task<WebApiResponse<IEnumerable<ServiceOrder>>> FindByDriver(Guid driverId);

        /// <summary>
        /// Automatically creates a ServiceOrder for the given Order (which must have a Driver
        /// assigned) plus its Commission, calculated from the Driver's CommissionPercentage over
        /// the Order's TotalPrice. Called when a trip is marked as Closed.
        /// </summary>
        /// <param name="order">The Order that was just closed.</param>
        /// <returns>Return an WebApiReponse with the ServiceOrder created for this operation.</returns>
        Task<WebApiResponse<ServiceOrder>> GenerateForOrder(Order order);
    }
}
