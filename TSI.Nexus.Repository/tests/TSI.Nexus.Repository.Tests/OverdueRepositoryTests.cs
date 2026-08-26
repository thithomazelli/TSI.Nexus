using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Data;
using TSI.Nexus.Repository.Overdue;

namespace TSI.Nexus.Repository.Tests
{
    // OverdueRepository uses EF Core's real ExecuteUpdateAsync, which the InMemory provider
    // does not support - SQLite (a relational provider) is the lightest option that does.
    public class OverdueRepositoryTests : IDisposable
    {
        private readonly SqliteConnection _connection;
        private readonly MyDBContextEF _context;
        private readonly OverdueRepository _repository;

        public OverdueRepositoryTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<MyDBContextEF>()
                .UseSqlite(_connection)
                .Options;
            _context = new MyDBContextEF(options);
            _context.Database.EnsureCreated();

            _repository = new OverdueRepository(_context);
        }

        public void Dispose()
        {
            _context.Dispose();
            _connection.Dispose();
        }

        [Fact]
        public async Task MarkOverduePaymentsAsync_ShouldMarkOnlyPendingPastDuePaymentsAsDelayed()
        {
            var transaction = new Transaction { Date = DateTime.UtcNow, Description = "T1" };
            _context.Set<Transaction>().Add(transaction);
            await _context.SaveChangesAsync();

            var overduePayment = NewPayment(transaction.Id, PaymentStatus.Pending, DateTime.UtcNow.AddDays(-5));
            var futurePayment = NewPayment(transaction.Id, PaymentStatus.Pending, DateTime.UtcNow.AddDays(5));
            var alreadyDelayedPayment = NewPayment(transaction.Id, PaymentStatus.Delayed, DateTime.UtcNow.AddDays(-5));
            var approvedPastDuePayment = NewPayment(transaction.Id, PaymentStatus.Approved, DateTime.UtcNow.AddDays(-5));

            _context.Set<Payment>().AddRange(
                overduePayment,
                futurePayment,
                alreadyDelayedPayment,
                approvedPastDuePayment
            );
            await _context.SaveChangesAsync();

            var updatedCount = await _repository.MarkOverduePaymentsAsync("system");

            Assert.Equal(1, updatedCount);

            // ExecuteUpdateAsync issues a direct SQL UPDATE and bypasses the change tracker, so
            // the previously-tracked Payment instances would otherwise still report their stale
            // in-memory values - clear the tracker to force a fresh read from the database.
            _context.ChangeTracker.Clear();

            var reloadedOverdue = await _context.Set<Payment>().FindAsync(overduePayment.Id);
            Assert.Equal(PaymentStatus.Delayed, reloadedOverdue!.Status);
            Assert.Equal("system", reloadedOverdue.ModifyUserId);

            Assert.Equal(
                PaymentStatus.Pending,
                (await _context.Set<Payment>().FindAsync(futurePayment.Id))!.Status
            );
            Assert.Equal(
                PaymentStatus.Delayed,
                (await _context.Set<Payment>().FindAsync(alreadyDelayedPayment.Id))!.Status
            );
            Assert.Equal(
                PaymentStatus.Approved,
                (await _context.Set<Payment>().FindAsync(approvedPastDuePayment.Id))!.Status
            );
        }

        [Fact]
        public async Task MarkOverduePaymentsAsync_ShouldReturnZero_WhenNothingIsOverdue()
        {
            var transaction = new Transaction { Date = DateTime.UtcNow, Description = "T1" };
            _context.Set<Transaction>().Add(transaction);
            await _context.SaveChangesAsync();

            _context.Set<Payment>().Add(NewPayment(transaction.Id, PaymentStatus.Pending, DateTime.UtcNow.AddDays(5)));
            await _context.SaveChangesAsync();

            var updatedCount = await _repository.MarkOverduePaymentsAsync("system");

            Assert.Equal(0, updatedCount);
        }

        private static Payment NewPayment(Guid transactionId, PaymentStatus status, DateTime date) =>
            new()
            {
                TransactionId = transactionId,
                Status = status,
                Type = PaymentType.Incoming,
                Condition = PaymentCondition.FullPayment,
                Method = PaymentMethod.Cash,
                Date = date,
                Price = 100m,
                PaymentNumber = new Random().Next(1, 1_000_000),
            };
    }
}
