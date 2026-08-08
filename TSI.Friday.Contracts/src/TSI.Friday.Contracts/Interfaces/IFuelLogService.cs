using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IFuelLogService
    {
        Task<WebApiResponse<FuelLog>> Add(FuelLog fuelLog);

        Task<WebApiResponse<FuelLog>> Update(FuelLog fuelLog);

        Task<WebApiResponse<FuelLog>> Remove(FuelLog fuelLog);

        Task<WebApiResponse<FuelLog>> FindById(Guid? id);

        Task<WebApiResponse<IEnumerable<FuelLog>>> FindByVehicle(Guid vehicleId);
    }
}
