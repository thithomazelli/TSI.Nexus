using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.Extensions.Logging;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;

namespace TSI.Friday.Services.Tests.Services
{
    public class QuoteServiceTests
    {
        private readonly QuoteService _quoteService;
        private readonly Mock<IRepository<Quote>> _repository;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly Mock<ILogService> _logService;
        private readonly Mock<IRepository<Product>> _productRepository;
        private readonly Mock<IOrderService> _orderService;
        private readonly Mock<ITripService> _tripService;
        private readonly Mock<IFeatureToggleService> _featureToggleService;
        private readonly IMapper _mapper;

        public QuoteServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _repository = new Mock<IRepository<Quote>>();
            _sequenceService = new Mock<ISequenceService>();
            _logService = new Mock<ILogService>();
            _productRepository = new Mock<IRepository<Product>>();
            _orderService = new Mock<IOrderService>();
            _tripService = new Mock<ITripService>();
            _featureToggleService = new Mock<IFeatureToggleService>();
            _mapper = config.CreateMapper();
            _quoteService = new QuoteService(
                _repository.Object,
                _sequenceService.Object,
                _mapper,
                _logService.Object,
                _productRepository.Object,
                _orderService.Object,
                _tripService.Object,
                _featureToggleService.Object
            );

            // Default: fleet module enabled, so the toggle guard is bypassed unless a test overrides this.
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
        }

        [Fact]
        public async Task QuoteService_FindByQuoteNumber_ShouldReturnNoData_WhenTripQuoteAndFleetModuleDisabled()
        {
            // Arrange
            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Trip,
            };

            _repository
                .Setup(_ =>
                    _.FirstOrDefaultAsync(
                        It.IsAny<Expression<Func<Quote, bool>>>(),
                        It.IsAny<Expression<Func<Quote, object>>[]>()
                    )
                )
                .ReturnsAsync(quote);
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByQuoteNumber("SER-Q00001");

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
        }

        [Fact]
        public async Task QuoteService_FindByBusinessPartnerId_ShouldFilterOutTripQuotes_WhenFleetModuleDisabled()
        {
            // Arrange
            var businessPartnerId = Guid.NewGuid();
            var quotes = new List<Quote>
            {
                new() { Id = Guid.NewGuid(), Type = QuoteType.Product },
                new() { Id = Guid.NewGuid(), Type = QuoteType.Trip },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Quote, bool>>>()))
                .ReturnsAsync(quotes);
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data);
            Assert.All(result.Data, q => Assert.Equal(QuoteType.Product, q.Type));
        }

        [Fact]
        public async Task QuoteService_FindByProductId_ShouldFilterOutTripQuotes_WhenFleetModuleDisabled()
        {
            // Arrange
            var productId = Guid.NewGuid();
            var quotes = new List<Quote>
            {
                new() { Id = Guid.NewGuid(), Type = QuoteType.Product },
                new() { Id = Guid.NewGuid(), Type = QuoteType.Trip },
            };

            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Quote, bool>>>()))
                .ReturnsAsync(quotes);
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByProductId(productId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data);
            Assert.All(result.Data, q => Assert.Equal(QuoteType.Product, q.Type));
        }

        [Fact]
        public async Task QuoteService_ConvertToTrip_ShouldReturnWarning_WhenFleetModuleDisabled()
        {
            // Arrange
            var quoteDto = new QuoteDto
            {
                Id = Guid.NewGuid(),
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Trip,
                BusinessPartnerId = Guid.NewGuid(),
            };

            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.ConvertToTrip(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _tripService.Verify(_ => _.Add(It.IsAny<TripDto>()), Times.Never);
        }
    }
}
