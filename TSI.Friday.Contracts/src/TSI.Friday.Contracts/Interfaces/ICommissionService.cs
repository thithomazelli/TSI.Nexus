using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ICommissionService
    {
        /// <summary>
        /// Update a Commission based on the object received. Commission records are created
        /// automatically by <see cref="IServiceOrderService.GenerateForOrder"/>, so there is no
        /// direct Add method here.
        /// </summary>
        /// <param name="commission">The commission object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<Commission>> Update(Commission commission);

        /// <summary>
        /// Method responsible to get only one Commission based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One Commission object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<Commission>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all Commissions registered for a given Driver.
        /// </summary>
        /// <param name="driverId">The Driver ID to be used on the search.</param>
        /// <returns>All Commissions found for the Driver.</returns>
        Task<WebApiResponse<IEnumerable<Commission>>> FindByDriver(Guid driverId);
    }
}
