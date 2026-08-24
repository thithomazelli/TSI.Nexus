using System.Globalization;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Services
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

        public async Task<WebApiResponse<IEnumerable<DashboardCardDto>>> GetInfoCardsAsync(int days)
        {
            var result = new WebApiResponse<IEnumerable<DashboardCardDto>>();
            var cards = new List<DashboardCardDto>();
            try
            {
                var nowUtc = DateTime.UtcNow;
                var from = nowUtc.Date.AddDays(-days + 1); // include today back 'days' days

                //1. Sum of Orders created in last 'days' days (DB aggregation)
                var ordersSum = await _orderRepo.SumAsync(o => o.Date >= from, o => o.TotalPrice);
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Novos Pedidos",
                        Value = ordersSum.ToString("C", CultureInfo.GetCultureInfo("pt-BR")),
                    }
                );

                //2/3 payments approved vs total and pending/delayed vs total (DB aggregations)
                // Only consider payments that belong to Incoming transactions for these percentages
                var totalIncomingPayments = await _paymentRepo.SumAsync(
                    p => p.Date >= from && p.Type == PaymentType.Incoming,
                    p => p.Price
                );
                var approvedIncomingSum = await _paymentRepo.SumAsync(
                    p =>
                        p.Date >= from
                        && p.Type == PaymentType.Incoming
                        && p.Status == PaymentStatus.Approved,
                    p => p.Price
                );
                var pendingDelayedIncomingSum = await _paymentRepo.SumAsync(
                    p =>
                        p.Date >= from
                        && p.Type == PaymentType.Incoming
                        && (p.Status == PaymentStatus.Pending || p.Status == PaymentStatus.Delayed),
                    p => p.Price
                );
                var approvedPct =
                    totalIncomingPayments == 0
                        ? 0
                        : (decimal)100 * approvedIncomingSum / totalIncomingPayments;
                var pendingPct =
                    totalIncomingPayments == 0
                        ? 0
                        : (decimal)100 * pendingDelayedIncomingSum / totalIncomingPayments;
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Aguardando (%)",
                        Value = Math.Round(pendingPct).ToString() + "%",
                    }
                );
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Recebidos (%)",
                        Value = Math.Round(approvedPct).ToString() + "%",
                    }
                );

                //4. Total order items with status = Delayed (DB count)
                var delayedCount = await _orderProductRepo.CountAsync(op =>
                    op.Status == OrderProductStatus.Delayed
                );
                cards.Add(
                    new DashboardCardDto
                    {
                        Title = "Devoluções em Atraso",
                        Value = delayedCount.ToString(),
                    }
                );

                result.Data = cards;
                result.Status = ResponseStatus.Success;
                result.Message = $"{cards.Count} info card(s) gerados.";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to build dashboard summary");
                result.Status = ResponseStatus.Error;
                result.Message = "Não foi possível gerar os info cards.";
            }

            return result;
        }
    }
}
