using Microsoft.Extensions.Configuration;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Repository.Overdue;

namespace TSI.Friday.Services.Services
{
    public class OverdueService : IOverdueService
    {
        private readonly IOverdueRepository _repo;
        private readonly IAlertConfigService _alertConfigService;
        private readonly string _systemUserId;

        #region Public methods

        public OverdueService(
            IOverdueRepository repo,
            IAlertConfigService alertConfigService,
            IConfiguration configuration
        )
        {
            _repo = repo;
            _alertConfigService = alertConfigService;
            _systemUserId = configuration["OverdueSystemUserId"] ?? "overdue-batch";
        }

        /// <inheritdoc />
        public async Task<OverdueResult> RunOverdueUpdateAsync()
        {
            if (!await _alertConfigService.IsEnabledAsync(AlertConfigKeys.DashboardOverdueReturns))
            {
                return new OverdueResult { OrderProductsUpdated = 0, PaymentsUpdated = 0 };
            }

            var ops = await _repo.MarkOverdueOrderProductsAsync(_systemUserId);
            var payments = await _repo.MarkOverduePaymentsAsync(_systemUserId);

            return new OverdueResult { OrderProductsUpdated = ops, PaymentsUpdated = payments };
        }

        #endregion Public methods
    }
}
