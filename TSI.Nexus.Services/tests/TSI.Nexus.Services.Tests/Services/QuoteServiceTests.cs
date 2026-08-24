using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
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
    public class QuoteServiceTests
    {
        private readonly QuoteService _quoteService;
        private readonly Mock<IRepository<Quote>> _repository;
        private readonly Mock<IRepository<QuoteTrip>> _quoteTripRepository;
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
            _quoteTripRepository = new Mock<IRepository<QuoteTrip>>();
            _sequenceService = new Mock<ISequenceService>();
            _logService = new Mock<ILogService>();
            _productRepository = new Mock<IRepository<Product>>();
            _orderService = new Mock<IOrderService>();
            _tripService = new Mock<ITripService>();
            _featureToggleService = new Mock<IFeatureToggleService>();
            _mapper = config.CreateMapper();
            _quoteService = new QuoteService(
                _repository.Object,
                _quoteTripRepository.Object,
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
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
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
        public async Task QuoteService_FindByBusinessPartnerId_ShouldFilterOutProductQuotes_WhenQuotesModuleDisabled()
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
                .Setup(_ =>
                    _.IsEnabledAsync(FeatureToggleKeys.Quote, FeatureToggleKeys.QuotesModule)
                )
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data);
            Assert.All(result.Data, q => Assert.Equal(QuoteType.Trip, q.Type));
        }

        [Fact]
        public async Task QuoteService_FindByProductId_ShouldFilterOutProductQuotes_WhenQuotesModuleDisabled()
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
                .Setup(_ =>
                    _.IsEnabledAsync(FeatureToggleKeys.Quote, FeatureToggleKeys.QuotesModule)
                )
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByProductId(productId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Single(result.Data);
            Assert.All(result.Data, q => Assert.Equal(QuoteType.Trip, q.Type));
        }

        [Fact]
        public async Task QuoteService_FindByQuoteNumber_ShouldReturnNoData_WhenProductQuoteAndQuotesModuleDisabled()
        {
            // Arrange
            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Product,
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
                .Setup(_ =>
                    _.IsEnabledAsync(FeatureToggleKeys.Quote, FeatureToggleKeys.QuotesModule)
                )
                .ReturnsAsync(false);

            // Act
            var result = await _quoteService.FindByQuoteNumber("SER-Q00001");

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
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

        [Fact]
        public async Task QuoteService_Add_ShouldPersistQuoteTrip_WhenTypeIsTripAndQuoteTripIsProvided()
        {
            // Arrange
            var quoteDto = new QuoteDto
            {
                BusinessPartnerId = Guid.NewGuid(),
                BusinessPartnerName = "SER",
                Type = QuoteType.Trip,
                QuoteTrip = new QuoteTripDto { Route = "SP-RJ", DistanceKm = 450, DailyCount = 1 },
            };

            _sequenceService.Setup(_ => _.GetNextValue("QuoteNumberSeq")).ReturnsAsync(1);

            // Act
            var result = await _quoteService.Add(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(result.Data.QuoteTrip);
            Assert.Equal("SP-RJ", result.Data.QuoteTrip.Route);
            _quoteTripRepository.Verify(
                _ =>
                    _.AddAsync(
                        It.Is<QuoteTrip>(qt =>
                            qt.Route == "SP-RJ" && qt.QuoteId == result.Data.Id
                        )
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task QuoteService_Add_ShouldNotPersistQuoteTrip_WhenTypeIsProduct()
        {
            // Arrange
            var quoteDto = new QuoteDto
            {
                BusinessPartnerId = Guid.NewGuid(),
                BusinessPartnerName = "SER",
                Type = QuoteType.Product,
            };

            _sequenceService.Setup(_ => _.GetNextValue("QuoteNumberSeq")).ReturnsAsync(1);

            // Act
            var result = await _quoteService.Add(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data.QuoteTrip);
            _quoteTripRepository.Verify(_ => _.AddAsync(It.IsAny<QuoteTrip>()), Times.Never);
        }

        [Fact]
        public async Task QuoteService_Update_ShouldCreateQuoteTrip_WhenNoneExistsYet()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var quoteDto = new QuoteDto
            {
                Id = quoteId,
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Trip,
                QuoteTrip = new QuoteTripDto { Route = "SP-RJ", DistanceKm = 450 },
            };

            _quoteTripRepository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<QuoteTrip, bool>>>()))
                .ReturnsAsync((QuoteTrip)null);

            // Act
            var result = await _quoteService.Update(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _quoteTripRepository.Verify(
                _ => _.AddAsync(It.Is<QuoteTrip>(qt => qt.QuoteId == quoteId)),
                Times.Once
            );
            _quoteTripRepository.Verify(_ => _.UpdateAsync(It.IsAny<QuoteTrip>()), Times.Never);
        }

        [Fact]
        public async Task QuoteService_Update_ShouldUpdateExistingQuoteTrip()
        {
            // Arrange
            var quoteId = Guid.NewGuid();
            var existingQuoteTrip = new QuoteTrip { Id = Guid.NewGuid(), QuoteId = quoteId };
            var quoteDto = new QuoteDto
            {
                Id = quoteId,
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Trip,
                QuoteTrip = new QuoteTripDto { Route = "RJ-SP", DistanceKm = 460 },
            };

            _quoteTripRepository
                .Setup(_ => _.FirstOrDefaultAsync(It.IsAny<Expression<Func<QuoteTrip, bool>>>()))
                .ReturnsAsync(existingQuoteTrip);

            // Act
            var result = await _quoteService.Update(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("RJ-SP", result.Data.QuoteTrip.Route);
            _quoteTripRepository.Verify(
                _ => _.UpdateAsync(It.Is<QuoteTrip>(qt => qt.Route == "RJ-SP")),
                Times.Once
            );
            _quoteTripRepository.Verify(_ => _.AddAsync(It.IsAny<QuoteTrip>()), Times.Never);
        }

        [Fact]
        public async Task QuoteService_ConvertToTrip_ShouldCarryQuoteTripFieldsIntoTripDto()
        {
            // Arrange
            var vehicleId = Guid.NewGuid();
            var driverId = Guid.NewGuid();
            var quoteDto = new QuoteDto
            {
                Id = Guid.NewGuid(),
                QuoteNumber = "SER-Q00001",
                Type = QuoteType.Trip,
                BusinessPartnerId = Guid.NewGuid(),
                QuoteTrip = new QuoteTripDto
                {
                    Route = "SP-RJ",
                    DistanceKm = 450,
                    DailyCount = 2,
                    TransportLicenseNumber = "ANTT-123",
                    VehicleId = vehicleId,
                    DriverId = driverId,
                },
            };

            TripDto capturedTripDto = null;
            _tripService
                .Setup(_ => _.Add(It.IsAny<TripDto>()))
                .Callback<TripDto>(dto => capturedTripDto = dto)
                .ReturnsAsync(new WebApiResponse<TripDto> { Status = ResponseStatus.Success });

            // Act
            var result = await _quoteService.ConvertToTrip(quoteDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(capturedTripDto);
            Assert.Equal("SP-RJ", capturedTripDto.Route);
            Assert.Equal(450, capturedTripDto.DistanceKm);
            Assert.Equal(2, capturedTripDto.DailyCount);
            Assert.Equal("ANTT-123", capturedTripDto.TransportLicenseNumber);
            Assert.Equal(vehicleId, capturedTripDto.VehicleId);
            Assert.Equal(driverId, capturedTripDto.DriverId);
        }
    }
}
