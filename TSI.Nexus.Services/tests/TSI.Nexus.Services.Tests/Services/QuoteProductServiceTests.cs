using System.Linq.Expressions;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;

namespace TSI.Nexus.Services.Tests.Services
{
    public class QuoteProductServiceTests
    {
        private readonly Mock<IRepository<QuoteProduct>> _repository;
        private readonly Mock<IRepository<Quote>> _quoteRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;
        private readonly QuoteProductService _service;

        public QuoteProductServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _mapper = config.CreateMapper();
            _repository = new Mock<IRepository<QuoteProduct>>();
            _quoteRepository = new Mock<IRepository<Quote>>();
            _logService = new Mock<ILogService>();
            _service = new QuoteProductService(
                _repository.Object,
                _quoteRepository.Object,
                _mapper,
                _logService.Object
            );

            // Default: recalc finds no items and no quote, so it's a safe no-op unless overridden.
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<QuoteProduct, bool>>>()))
                .ReturnsAsync(new List<QuoteProduct>());
        }

        [Fact]
        public async Task Add_ShouldAddAndRecalculateQuotePrice_WhenRepositorySucceeds()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var dto = new QuoteProductDto
            {
                OrderId = quoteId,
                Quantity = 2,
                Price = 100,
                Discount = 10,
            };
            var quote = new Quote { Id = quoteId, Price = 0 };

            _repository
                .Setup(_ => _.AddAsync(It.IsAny<QuoteProduct>()))
                .Callback<QuoteProduct>(qp => qp.Id = Guid.NewGuid())
                .Returns(Task.CompletedTask);
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<QuoteProduct, bool>>>()))
                .ReturnsAsync(
                    new List<QuoteProduct>
                    {
                        new()
                        {
                            QuoteId = quoteId,
                            Quantity = 2,
                            Price = 100,
                            Discount = 10,
                        },
                    }
                );
            _quoteRepository.Setup(_ => _.GetByIdAsync(quoteId)).ReturnsAsync(quote);

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotEqual(Guid.Empty, result.Data!.Id);
            _repository.Verify(_ => _.AddAsync(It.IsAny<QuoteProduct>()), Times.Once);
            _quoteRepository.Verify(_ => _.UpdateAsync(It.Is<Quote>(q => q.Price == 180m)), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var dto = new QuoteProductDto { OrderId = Guid.NewGuid() };
            _repository.Setup(_ => _.AddAsync(It.IsAny<QuoteProduct>())).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Add(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "QuoteProductService.Add", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task Update_ShouldUpdateAndRecalculateQuotePrice_WhenQuoteExists()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var dto = new QuoteProductDto
            {
                OrderId = quoteId,
                Quantity = 1,
                Price = 50,
                Discount = 0,
            };
            var quote = new Quote { Id = quoteId, Price = 0 };
            _quoteRepository.Setup(_ => _.GetByIdAsync(quoteId)).ReturnsAsync(quote);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.UpdateAsync(It.IsAny<QuoteProduct>()), Times.Once);
            _quoteRepository.Verify(_ => _.UpdateAsync(quote), Times.Once);
        }

        [Fact]
        public async Task Update_ShouldSkipQuoteUpdate_WhenQuoteIsNotFound()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var dto = new QuoteProductDto { OrderId = quoteId };
            _quoteRepository.Setup(_ => _.GetByIdAsync(quoteId)).ReturnsAsync((Quote)null!);

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _quoteRepository.Verify(_ => _.UpdateAsync(It.IsAny<Quote>()), Times.Never);
        }

        [Fact]
        public async Task Update_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var dto = new QuoteProductDto { OrderId = Guid.NewGuid() };
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<QuoteProduct>())).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Update(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "QuoteProductService.Update", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task Remove_ShouldRemoveAndRecalculateQuotePrice_WhenExistingIsFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var quoteId = Guid.NewGuid();
            var existing = new QuoteProduct { Id = id, QuoteId = quoteId };
            var quote = new Quote { Id = quoteId, Price = 0 };
            var dto = new QuoteProductDto { Id = id };

            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(existing);
            _quoteRepository.Setup(_ => _.GetByIdAsync(quoteId)).ReturnsAsync(quote);

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(_ => _.RemoveAsync(existing), Times.Once);
            _quoteRepository.Verify(_ => _.UpdateAsync(quote), Times.Once);
        }

        [Fact]
        public async Task Remove_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            var dto = new QuoteProductDto { Id = id };
            _repository.Setup(_ => _.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.Remove(dto);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
            _logService.Verify(
                _ => _.LogException(It.IsAny<Exception>(), "QuoteProductService.Remove", dto),
                Times.Once
            );
        }

        [Fact]
        public async Task FindAll_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var items = new List<QuoteProduct> { new() { Id = Guid.NewGuid() } };
            _repository
                .Setup(_ => _.GetAllAsync(
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindAll_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.GetAllAsync(
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task FindByOrderId_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var items = new List<QuoteProduct> { new() { Id = Guid.NewGuid(), QuoteId = quoteId } };
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindByOrderId(quoteId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindByOrderId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByOrderId(Guid.NewGuid());

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task FindByProductId_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var items = new List<QuoteProduct> { new() { Id = Guid.NewGuid(), ProductId = productId } };
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindByProductId(productId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindByProductId_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindByProductId(Guid.NewGuid());

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task FindById_ShouldReturnMappedItem_WhenFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            var item = new QuoteProduct { Id = id };
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync(item);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("Item do Orçamento encontrado com sucesso", result.Message);
        }

        [Fact]
        public async Task FindById_ShouldReturnNoData_WhenNotFound()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository.Setup(_ => _.GetByIdAsync(id)).ReturnsAsync((QuoteProduct)null!);

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhum Item do Orçamento com o ID {id} foi encontrado", result.Message);
        }

        [Fact]
        public async Task FindById_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            var id = Guid.NewGuid();
            _repository.Setup(_ => _.GetByIdAsync(id)).ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }

        [Fact]
        public async Task FindDelayed_ShouldReturnMappedItems_WhenRepositorySucceeds()
        {
            // Arrange
            var items = new List<QuoteProduct> { new() { Id = Guid.NewGuid(), Status = OrderProductStatus.Delayed } };
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ReturnsAsync(items);

            // Act
            var result = await _service.FindDelayed();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data!);
        }

        [Fact]
        public async Task FindDelayed_ShouldReturnError_WhenRepositoryThrows()
        {
            // Arrange
            _repository
                .Setup(_ => _.QueryAsync(
                    It.IsAny<Expression<Func<QuoteProduct, bool>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>(),
                    It.IsAny<Expression<Func<QuoteProduct, object>>>()
                ))
                .ThrowsAsync(new Exception("boom"));

            // Act
            var result = await _service.FindDelayed();

            // Assert
            Assert.Equal(ResponseStatus.Error, result.Status);
        }
    }
}
