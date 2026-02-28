using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data;

namespace TSI.Friday.WebAPI.BackgroundServices
{
 public class OverdueStatusBackgroundService : BackgroundService
 {
 private readonly IServiceScopeFactory _scopeFactory;
 private readonly ILogger<OverdueStatusBackgroundService> _logger;
 private readonly TimeSpan _interval;

 public OverdueStatusBackgroundService(
 IServiceScopeFactory scopeFactory,
 ILogger<OverdueStatusBackgroundService> logger,
 IConfiguration configuration
 )
 {
 _scopeFactory = scopeFactory;
 _logger = logger;

 var seconds =60; // default
 if (int.TryParse(configuration["OverdueCheckIntervalSeconds"], out var cfgSec) && cfgSec >0)
 {
 seconds = cfgSec;
 }

 _interval = TimeSpan.FromSeconds(seconds);
 }

 protected override async Task ExecuteAsync(CancellationToken stoppingToken)
 {
 _logger.LogInformation("OverdueStatusBackgroundService started, interval {Interval}", _interval);

 while (!stoppingToken.IsCancellationRequested)
 {
 try
 {
 await ProcessOnceAsync(stoppingToken);
 }
 catch (Exception ex)
 {
 _logger.LogError(ex, "Error while running overdue status update");
 }

 await Task.Delay(_interval, stoppingToken);
 }

 _logger.LogInformation("OverdueStatusBackgroundService stopping");
 }

 private async Task ProcessOnceAsync(CancellationToken cancellationToken)
 {
 using var scope = _scopeFactory.CreateScope();
 var context = scope.ServiceProvider.GetRequiredService<MyDBContextEF>();

 var nowUtc = DateTime.UtcNow;

 // Update OrderProducts: InProgress -> Delayed when EndDate < now
 try
 {
 var opQuery = context.Set<OrderProduct>().Where(op =>
 op.Status == OrderProductStatus.InProgress
 && op.EndDate != default(DateTime)
 && op.EndDate < nowUtc
 );

 // Use ExecuteUpdateAsync to perform in-database update without loading entities
 var updatedOps = await opQuery.ExecuteUpdateAsync(s => s
 .SetProperty(op => op.Status, op => OrderProductStatus.Delayed)
 .SetProperty(op => op.ModifyDate, op => DateTime.UtcNow)
 .SetProperty(op => op.ModifyUserId, op => "system")
 , cancellationToken);

 if (updatedOps >0)
 {
 _logger.LogInformation("Marked {Count} OrderProduct(s) as Delayed", updatedOps);
 }
 }
 catch (Exception ex)
 {
 _logger.LogError(ex, "Failed to update overdue OrderProducts");
 }

 // Update Payments: Pending -> Delayed when Date < now
 try
 {
 var pQuery = context.Set<Payment>().Where(p =>
 p.Status == PaymentStatus.Pending
 && p.Date < nowUtc
 );

 var updatedPayments = await pQuery.ExecuteUpdateAsync(s => s
 .SetProperty(p => p.Status, p => PaymentStatus.Delayed)
 .SetProperty(p => p.ModifyDate, p => DateTime.UtcNow)
 .SetProperty(p => p.ModifyUserId, p => "system")
 , cancellationToken);

 if (updatedPayments >0)
 {
 _logger.LogInformation("Marked {Count} Payment(s) as Delayed", updatedPayments);
 }
 }
 catch (Exception ex)
 {
 _logger.LogError(ex, "Failed to update overdue Payments");
 }
 }
 }
}
