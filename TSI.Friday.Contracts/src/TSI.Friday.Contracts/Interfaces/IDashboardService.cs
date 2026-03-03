using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IDashboardService
    {
        Task<WebApiResponse<IEnumerable<DashboardCardDto>>> GetInfoCardsAsync();
    }
}
