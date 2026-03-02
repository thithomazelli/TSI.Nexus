using System.Globalization;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IRepository<Order> _orderRepo;
        private readonly IRepository<Payment> _paymentRepo;
        private readonly IRepository<OrderProduct> _orderProductRepo;
        private readonly ILogger<DashboardService> _logger;

        public DashboardService(
            IRepository<Order> orderRepo,
            IRepository<Payment> paymentRepo,
            IRepository<OrderProduct> orderProductRepo,
            ILogger<DashboardService> logger
        )
        {
            _orderRepo = orderRepo;
            _paymentRepo = paymentRepo;
            _orderProductRepo = orderProductRepo;
            _logger = logger;
        }

        public async Task<IEnumerable<DashboardCardDto>> GetHomeSummaryAsync()
        {
            var cards = new List<DashboardCardDto>();
            try
            {
                var now = DateTime.UtcNow.Date;
                var from = now.AddDays(-30);

                //1. Sum of Orders created in last30 days (DB aggregation)
                var ordersSum = await _orderRepo.SumAsync(o => o.CreateDate.ToUniversalTime().Date >= from, o => o.TotalPrice);
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Orders (30d)",
                        Value = ordersSum.ToString("C", CultureInfo.GetCultureInfo("pt-BR")),
                    }
                );

                //2/3 payments approved vs total and pending/delayed vs total (DB aggregations)
                var totalPayments = await _paymentRepo.SumAsync(p => p.Date.ToUniversalTime().Date >= from, p => p.Price);
                var approvedSum = await _paymentRepo.SumAsync(p => p.Date.ToUniversalTime().Date >= from && p.Status == PaymentStatus.Approved, p => p.Price);
                var pendingDelayedSum = await _paymentRepo.SumAsync(p => p.Date.ToUniversalTime().Date >= from && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Delayed), p => p.Price);
                var approvedPct = totalPayments ==0 ?0 : (decimal)100 * approvedSum / totalPayments;
                var pendingPct = totalPayments ==0 ?0 : (decimal)100 * pendingDelayedSum / totalPayments;
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Recebidos (%)",
                        Value = Math.Round(approvedPct).ToString() + "%",
                    }
                );
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Aguardando (%)",
                        Value = Math.Round(pendingPct).ToString() + "%",
                    }
                );

                //4. Total order items with status = Delayed (DB count)
                var delayedCount = await _orderProductRepo.CountAsync(op => op.Status == OrderProductStatus.Delayed);
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Itens Atrasados",
                        Value = delayedCount.ToString(),
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build dashboard summary");
            }
            return cards;
        }
    }
}
