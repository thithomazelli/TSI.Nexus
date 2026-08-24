using Microsoft.Extensions.Configuration;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Repository.Overdue;

namespace TSI.Nexus.Services.Services
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

        /// <inheritdoc />
        public async Task<OverdueResult> RunOverdueUpdateAsync()
        {
            var ops = await _repo.MarkOverdueOrderProductsAsync(_systemUserId);
            var payments = await _repo.MarkOverduePaymentsAsync(_systemUserId);

            return new OverdueResult { OrderProductsUpdated = ops, PaymentsUpdated = payments };
        }

        #endregion Public methods
    }
}
