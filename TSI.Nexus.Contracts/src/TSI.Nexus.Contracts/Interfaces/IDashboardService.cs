using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IDashboardService
    {
        Task<WebApiResponse<IEnumerable<DashboardCardDto>>> GetInfoCardsAsync(int days);
    }
}
