using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ICommissionService
    {
        Task<WebApiResponse<Commission>> Update(Commission commission);

        Task<WebApiResponse<Commission>> FindById(Guid? id);

        Task<WebApiResponse<IEnumerable<Commission>>> FindByDriver(Guid driverId);
    }
}
