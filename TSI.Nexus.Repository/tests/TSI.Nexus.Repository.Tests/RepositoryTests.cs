using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Data;

namespace TSI.Nexus.Repository.Tests
{
    public class RepositoryTests
    {
        private readonly MyDBContextEF _context;
        private readonly Repository<Driver> _repository;

        public RepositoryTests()
        {
            var options = new DbContextOptionsBuilder<MyDBContextEF>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;
            _context = new MyDBContextEF(options);
            _repository = new Repository<Driver>(_context);
        }

        private static Driver NewDriver(string name = "Driver", DateTime? createDate = null) =>
            new()
            {
                Name = name,
                SocialSecurityCard = Guid.NewGuid().ToString(),
                CreateDate = createDate ?? DateTime.UtcNow,
                Status = DriverStatus.Active,
            };

        [Fact]
        public async Task AddAsync_ShouldGenerateId_WhenEntityIdIsEmpty()
        {
            var driver = NewDriver();
            driver.Id = Guid.Empty;

            await _repository.AddAsync(driver);

            Assert.NotEqual(Guid.Empty, driver.Id);
            Assert.NotNull(await _context.Driver.FindAsync(driver.Id));
        }

        [Fact]
        public async Task AddAsync_ShouldKeepExplicitId_WhenAlreadySet()
        {
            var driver = NewDriver();
            var explicitId = Guid.NewGuid();
            driver.Id = explicitId;

            await _repository.AddAsync(driver);

            Assert.Equal(explicitId, driver.Id);
        }

        [Fact]
        public async Task UpdateAsync_ShouldPersistChanges()
        {
            var driver = NewDriver();
            await _repository.AddAsync(driver);

            driver.Name = "Updated Name";
            await _repository.UpdateAsync(driver);

            var reloaded = await _context.Driver.FindAsync(driver.Id);
            Assert.Equal("Updated Name", reloaded!.Name);
        }

        [Fact]
        public async Task UpdateRangeAsync_ShouldPersistAllChanges()
        {
            var driver1 = NewDriver("First");
            var driver2 = NewDriver("Second");
            await _repository.AddAsync(driver1);
            await _repository.AddAsync(driver2);
            _context.ChangeTracker.Clear();

            driver1.Name = "First Updated";
            driver2.Name = "Second Updated";
            await _repository.UpdateRangeAsync(new[] { driver1, driver2 });

            Assert.Equal("First Updated", (await _context.Driver.FindAsync(driver1.Id))!.Name);
            Assert.Equal("Second Updated", (await _context.Driver.FindAsync(driver2.Id))!.Name);
        }

        [Fact]
        public async Task RemoveAsync_ShouldDeleteEntity()
        {
            var driver = NewDriver();
            await _repository.AddAsync(driver);

            await _repository.RemoveAsync(driver);

            Assert.Null(await _context.Driver.FindAsync(driver.Id));
        }

        [Fact]
        public async Task GetByIdAsync_ShouldReturnEntity_WhenFound()
        {
            var driver = NewDriver();
            await _repository.AddAsync(driver);

            var result = await _repository.GetByIdAsync(driver.Id);

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task GetByIdAsync_ShouldThrowKeyNotFoundException_WhenNotFound()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _repository.GetByIdAsync(Guid.NewGuid())
            );
        }

        [Fact]
        public async Task GetByIdAsync_WithIncludes_ShouldReturnEntity_WhenFound()
        {
            var driver = NewDriver();
            await _repository.AddAsync(driver);

            var result = await _repository.GetByIdAsync(driver.Id, d => d.Trips);

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task GetByIdAsync_WithIncludes_ShouldThrowKeyNotFoundException_WhenNotFound()
        {
            await Assert.ThrowsAsync<KeyNotFoundException>(
                () => _repository.GetByIdAsync(Guid.NewGuid(), d => d.Trips)
            );
        }

        [Fact]
        public async Task GetByIdAsync_WithNullIncludes_ShouldReturnEntity()
        {
            var driver = NewDriver();
            await _repository.AddAsync(driver);

            var result = await _repository.GetByIdAsync(driver.Id, (Expression<Func<Driver, object>>[])null!);

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task GetByNameAsync_ShouldThrowArgumentException_WhenKeyTypeIsNotString()
        {
            // Driver's primary key is a Guid, so EF Core rejects the string key value outright
            // (before even querying) - documents the repository's actual behavior against a
            // Guid-keyed entity rather than assuming FindAsync degrades gracefully.
            await Assert.ThrowsAsync<ArgumentException>(
                () => _repository.GetByNameAsync("any-name")
            );
        }

        [Fact]
        public async Task AnyAsync_ShouldReturnTrue_WhenMatchExists()
        {
            var driver = NewDriver("Findable");
            await _repository.AddAsync(driver);

            var result = await _repository.AnyAsync(d => d.Name == "Findable");

            Assert.True(result);
        }

        [Fact]
        public async Task AnyAsync_ShouldReturnFalse_WhenNoMatch()
        {
            var result = await _repository.AnyAsync(d => d.Name == "Nonexistent");

            Assert.False(result);
        }

        [Fact]
        public async Task FirstOrDefaultAsync_ShouldReturnEntity_WhenFound()
        {
            var driver = NewDriver("Unique");
            await _repository.AddAsync(driver);

            var result = await _repository.FirstOrDefaultAsync(d => d.Name == "Unique");

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task FirstOrDefaultAsync_ShouldThrowInvalidOperationException_WhenNotFound()
        {
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _repository.FirstOrDefaultAsync(d => d.Name == "Nonexistent")
            );
        }

        [Fact]
        public async Task FirstOrDefaultAsync_WithIncludes_ShouldReturnEntity_WhenFound()
        {
            var driver = NewDriver("Unique");
            await _repository.AddAsync(driver);

            var result = await _repository.FirstOrDefaultAsync(d => d.Name == "Unique", d => d.Trips);

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task FirstOrDefaultAsync_WithIncludes_ShouldThrowInvalidOperationException_WhenNotFound()
        {
            await Assert.ThrowsAsync<InvalidOperationException>(
                () => _repository.FirstOrDefaultAsync(d => d.Name == "Nonexistent", d => d.Trips)
            );
        }

        [Fact]
        public async Task FirstOrDefaultAsync_WithEmptyIncludes_ShouldReturnEntity()
        {
            var driver = NewDriver("Unique");
            await _repository.AddAsync(driver);

            var result = await _repository.FirstOrDefaultAsync(
                d => d.Name == "Unique",
                Array.Empty<Expression<Func<Driver, object>>>()
            );

            Assert.Equal(driver.Id, result.Id);
        }

        [Fact]
        public async Task QueryAsync_ShouldReturnMatchingEntitiesOrderedByCreateDate()
        {
            var older = NewDriver("Older", DateTime.UtcNow.AddDays(-1));
            var newer = NewDriver("Newer", DateTime.UtcNow);
            await _repository.AddAsync(newer);
            await _repository.AddAsync(older);

            var result = await _repository.QueryAsync(d => d.Status == DriverStatus.Active);

            Assert.Equal(2, result.Count);
            Assert.Equal(older.Id, result[0].Id);
            Assert.Equal(newer.Id, result[1].Id);
        }

        [Fact]
        public async Task QueryAsync_WithIncludes_ShouldReturnMatchingEntities()
        {
            var driver = NewDriver("Findable");
            await _repository.AddAsync(driver);

            var result = await _repository.QueryAsync(d => d.Name == "Findable", d => d.Trips);

            Assert.Single(result);
        }

        [Fact]
        public async Task QueryAsync_WithEmptyIncludes_ShouldReturnMatchingEntities()
        {
            var driver = NewDriver("Findable");
            await _repository.AddAsync(driver);

            var result = await _repository.QueryAsync(
                d => d.Name == "Findable",
                Array.Empty<Expression<Func<Driver, object>>>()
            );

            Assert.Single(result);
        }

        [Fact]
        public async Task GetAllAsync_ShouldReturnAllEntitiesOrderedByCreateDate()
        {
            var older = NewDriver("Older", DateTime.UtcNow.AddDays(-1));
            var newer = NewDriver("Newer", DateTime.UtcNow);
            await _repository.AddAsync(newer);
            await _repository.AddAsync(older);

            var result = await _repository.GetAllAsync();

            Assert.Equal(2, result.Count);
            Assert.Equal(older.Id, result[0].Id);
        }

        [Fact]
        public async Task GetAllAsync_WithIncludes_ShouldReturnAllEntities()
        {
            await _repository.AddAsync(NewDriver());

            var result = await _repository.GetAllAsync(d => d.Trips);

            Assert.Single(result);
        }

        [Fact]
        public async Task GetAllAsync_WithEmptyIncludes_ShouldReturnAllEntities()
        {
            await _repository.AddAsync(NewDriver());

            var result = await _repository.GetAllAsync(Array.Empty<Expression<Func<Driver, object>>>());

            Assert.Single(result);
        }

        [Fact]
        public async Task SumAsync_ShouldSumMatchingEntities()
        {
            var transactionRepository = new Repository<Transaction>(_context);
            await transactionRepository.AddAsync(
                new Transaction { Date = DateTime.UtcNow, Description = "T1" }
            );
            await transactionRepository.AddAsync(
                new Transaction { Date = DateTime.UtcNow, Description = "T2" }
            );
            var paymentRepository = new Repository<Payment>(_context);
            var transactions = await _context.Set<Transaction>().ToListAsync();
            await paymentRepository.AddAsync(
                NewPayment(transactions[0].Id, PaymentStatus.Pending, 100m)
            );
            await paymentRepository.AddAsync(
                NewPayment(transactions[1].Id, PaymentStatus.Pending, 50m)
            );

            var sum = await paymentRepository.SumAsync(
                p => p.Status == PaymentStatus.Pending,
                p => p.Price
            );

            Assert.Equal(150m, sum);
        }

        [Fact]
        public async Task CountAsync_ShouldCountMatchingEntities()
        {
            await _repository.AddAsync(NewDriver("A"));
            await _repository.AddAsync(NewDriver("B"));

            var count = await _repository.CountAsync(d => d.Status == DriverStatus.Active);

            Assert.Equal(2, count);
        }

        [Fact]
        public async Task ExecuteUpdateAsync_ShouldUpdateMatchingEntitiesAndReturnCount()
        {
            var driver = NewDriver("Before");
            await _repository.AddAsync(driver);

            var updatedCount = await _repository.ExecuteUpdateAsync(
                d => d.Name == "Before",
                d => d.Name = "After"
            );

            Assert.Equal(1, updatedCount);
            Assert.Equal("After", (await _context.Driver.FindAsync(driver.Id))!.Name);
        }

        [Fact]
        public async Task ExecuteUpdateAsync_ShouldReturnZero_WhenNoEntitiesMatch()
        {
            var updatedCount = await _repository.ExecuteUpdateAsync(
                d => d.Name == "NoSuchDriver",
                d => d.Name = "After"
            );

            Assert.Equal(0, updatedCount);
        }

        private static Payment NewPayment(Guid transactionId, PaymentStatus status, decimal price) =>
            new()
            {
                TransactionId = transactionId,
                Status = status,
                Type = PaymentType.Incoming,
                Condition = PaymentCondition.FullPayment,
                Method = PaymentMethod.Cash,
                Date = DateTime.UtcNow,
                Price = price,
                PaymentNumber = new Random().Next(1, 1_000_000),
            };
    }
}
