using Microsoft.Extensions.Configuration;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Repository.Overdue;

namespace TSI.Friday.Services.Services
{
    public class OverdueService : IOverdueService
    {
        private readonly IOverdueRepository _repo;
        private readonly string _systemUserId;

        #region Public methods

        public OverdueService(IOverdueRepository repo, IConfiguration configuration)
        {
            _repo = repo;
            _systemUserId = configuration["OverdueSystemUserId"] ?? "overdue-batch";
        }

        public async Task<OverdueResult> RunOverdueUpdateAsync()
        {
            var ops = await _repo.MarkOverdueOrderProductsAsync(_systemUserId);
            var payments = await _repo.MarkOverduePaymentsAsync(_systemUserId);

            return new OverdueResult { OrderProductsUpdated = ops, PaymentsUpdated = payments };
        }

        #endregion Public methods
    }
}
