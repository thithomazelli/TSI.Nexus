using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models.DTOs;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IDashboardService
    {
        Task<IEnumerable<DashboardCardDto>> GetHomeSummaryAsync();
    }
}
