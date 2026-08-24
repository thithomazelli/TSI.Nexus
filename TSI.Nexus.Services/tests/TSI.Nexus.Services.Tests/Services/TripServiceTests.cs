using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using AutoMapper;
using FluentAssertions;
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
    public class TripServiceTests
    {
        private readonly TripService _tripService;
        private readonly Mock<IRepository<Trip>> _repository;
        private readonly Mock<IRepository<Vehicle>> _vehicleRepository;
        private readonly Mock<ITransactionService> _transactionService;
        private readonly Mock<IServiceOrderService> _serviceOrderService;
        private readonly Mock<ISequenceService> _sequenceService;
        private readonly Mock<ICurrentUserService> _currentUserService;
        private readonly Mock<IFeatureToggleService> _featureToggleService;
        private readonly Mock<ILogService> _logService;
        private readonly IList<TripDto> _tripListMock;
        private readonly IMapper _mapper;

        public TripServiceTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _repository = new Mock<IRepository<Trip>>();
            _vehicleRepository = new Mock<IRepository<Vehicle>>();
            _transactionService = new Mock<ITransactionService>();
            _serviceOrderService = new Mock<IServiceOrderService>();
            _sequenceService = new Mock<ISequenceService>();
            _currentUserService = new Mock<ICurrentUserService>();
            _featureToggleService = new Mock<IFeatureToggleService>();
            _logService = new Mock<ILogService>();
            _mapper = config.CreateMapper();
            _tripService = new TripService(
                _repository.Object,
                _vehicleRepository.Object,
                _transactionService.Object,
                _serviceOrderService.Object,
                _sequenceService.Object,
                _currentUserService.Object,
                _featureToggleService.Object,
                _mapper,
                _logService.Object
            );

            // Default: current user is Admin, so ownership checks are bypassed unless a test overrides this.
            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(true);

            // Default: fleet module enabled, so the toggle guard is bypassed unless a test overrides this.
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(It.IsAny<string>()))
                .ReturnsAsync(true);
            _featureToggleService
                            .Setup(_ => _.IsEnabledAsync(It.IsAny<string>(), It.IsAny<string>()))
                            .ReturnsAsync(true);

            // Default: no vehicle found, so the vehicle-assignment check is safely skipped unless a
            // test overrides this.
            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle>());

            // Default: no previous Trip state found, so the Closed-transition auto-ServiceOrder
            // trigger and the ownership-by-id lookup are both safely skipped unless a test overrides this.
            _repository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Trip, bool>>>()))
                .ReturnsAsync(new List<Trip>());

            _tripListMock = new List<TripDto>
            {
                new TripDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    TripNumber = "SER-V00001",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    BusinessPartnerName = "SER",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                    QuoteNumber = string.Empty,
                },
                new TripDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    TripNumber = "THG-V00002",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    BusinessPartnerName = "THG",
                    Transaction = new TransactionDto(),
                    TransactionId = Guid.Parse("00000000-0000-0000-0000-000000000000"),
                    QuoteNumber = string.Empty,
                },
            };
        }

        [Fact]
        public async Task TripService_Add_ShouldAddTripSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var tripDto = new TripDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                TripNumber = "SER-V00001",
                BusinessPartnerName = "SER",
                Transaction = new TransactionDto(),
                QuoteNumber = string.Empty,
            };

            var transactionDto = new TransactionDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                TripId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
            };

            _repository.Setup(r => r.AddAsync(It.IsAny<Trip>())).Returns(Task.CompletedTask);
            _transactionService
                .Setup(_ => _.Add(It.IsAny<TransactionDto>()))
                .ReturnsAsync(new WebApiResponse<TransactionDto> { Data = transactionDto });
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            // Act
            var result = await _tripService.Add(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"Viagem {tripDto.TripNumber} cadastrada com sucesso.", result.Message);
            _repository.Verify(r => r.AddAsync(It.IsAny<Trip>()), Times.Once);
        }

        [Fact]
        public async Task TripService_Add_ShouldReturnWarningAndNotAddTrip_WhenVehicleIsBlocked()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000099");
            var tripDto = new TripDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                TripNumber = "SER-V00001",
                BusinessPartnerName = "SER",
                VehicleId = vehicleId,
                Transaction = new TransactionDto(),
                QuoteNumber = string.Empty,
            };

            var blockedVehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Blocked,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { blockedVehicle });

            // Act
            var result = await _tripService.Add(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            Assert.Equal(
                $"O veículo {blockedVehicle.Plate} está bloqueado por manutenção vencida e não pode ser vinculado a uma viagem.",
                result.Message
            );
            _repository.Verify(r => r.AddAsync(It.IsAny<Trip>()), Times.Never);
        }

        [Fact]
        public async Task TripService_Add_ShouldCalculatePriceFromVehicleRates_WhenDistanceAndDailyCountAreInformed()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000098");
            var tripDto = new TripDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                TripNumber = "SER-V00001",
                BusinessPartnerName = "SER",
                VehicleId = vehicleId,
                DistanceKm = 100,
                DailyCount = 2,
                Transaction = new TransactionDto(),
                QuoteNumber = string.Empty,
            };

            var availableVehicle = new Vehicle
            {
                Id = vehicleId,
                Plate = "ABC1D23",
                Status = VehicleStatus.Available,
                PricePerKm = 5.00M,
                DailyRate = 300.00M,
            };

            _vehicleRepository
                .Setup(_ => _.QueryAsync(It.IsAny<Expression<Func<Vehicle, bool>>>()))
                .ReturnsAsync(new List<Vehicle> { availableVehicle });

            Trip capturedTrip = null;
            _repository
                .Setup(r => r.AddAsync(It.IsAny<Trip>()))
                .Callback<Trip>(t => capturedTrip = t)
                .Returns(Task.CompletedTask);
            _transactionService
                .Setup(_ => _.Add(It.IsAny<TransactionDto>()))
                .ReturnsAsync(
                    new WebApiResponse<TransactionDto> { Data = new TransactionDto { Id = Guid.NewGuid() } }
                );
            _sequenceService.Setup(_ => _.GetNextValue(It.IsAny<string>())).ReturnsAsync(1);

            // Act
            var result = await _tripService.Add(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(capturedTrip);
            // 100km * 5.00 + 2 daily * 300.00 = 500 + 600 = 1100
            Assert.Equal(1100.00M, capturedTrip.Price);
        }

        [Fact]
        public async Task TripService_Remove_ShouldRemoveTripSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var tripDto = _tripListMock.First();
            var tripEntity = _mapper.Map<Trip>(_tripListMock.First());

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        It.IsAny<Guid>(),
                        t => t.TripLegs,
                        t => t.Passengers,
                        p => p.Transaction
                    )
                )
                .ReturnsAsync(tripEntity);
            _repository.Setup(r => r.RemoveAsync(It.IsAny<Trip>())).Returns(Task.CompletedTask);

            // Act
            var result = await _tripService.Remove(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"Viagem {tripDto.TripNumber} removida com sucesso.", result.Message);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Trip>()), Times.Once);
        }

        [Fact]
        public async Task TripService_Remove_ShouldReturnWarningAndNotRemove_WhenTripBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var tripDto = _tripListMock.First();
            var tripEntity = _mapper.Map<Trip>(_tripListMock.First());
            tripEntity.CreateUserId = "owner-user-id";

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        It.IsAny<Guid>(),
                        t => t.TripLegs,
                        t => t.Passengers,
                        p => p.Transaction
                    )
                )
                .ReturnsAsync(tripEntity);

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _tripService.Remove(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Trip>()), Times.Never);
        }

        [Fact]
        public async Task TripService_FindById_ShouldReturnTrip_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var tripDto = _tripListMock.First(t => t.Id == id);
            var tripEntity = _mapper.Map<Trip>(tripDto);
            tripEntity.BusinessPartner = new Individual { Name = "SER" };

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync(tripEntity);

            // Act
            var result = await _tripService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"Viagem {tripDto.TripNumber} encontrada com sucesso", result.Message);
            _repository.Verify(
                r =>
                    r.GetByIdAsync(
                        id,
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task TripService_FindById_ShouldReturnWarning_WhenTripBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var tripDto = _tripListMock.First(t => t.Id == id);
            var tripEntity = _mapper.Map<Trip>(tripDto);
            tripEntity.CreateUserId = "owner-user-id";

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync(tripEntity);

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _tripService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            Assert.Null(result.Data);
        }

        [Fact]
        public async Task TripService_FindById_ShouldReturnTrip_WhenTripBelongsToCurrentUser()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var tripDto = _tripListMock.First(t => t.Id == id);
            var tripEntity = _mapper.Map<Trip>(tripDto);
            tripEntity.CreateUserId = "owner-user-id";
            tripEntity.BusinessPartner = new Individual { Name = "SER" };

            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync(tripEntity);

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("owner-user-id");

            // Act
            var result = await _tripService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.NotNull(result.Data);
        }

        [Fact]
        public async Task TripService_FindById_ShouldReturnNoData_WhenIdIsNotFound()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000010");
            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        id,
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Transaction.Payments
                    )
                )
                .ReturnsAsync((Trip)null);

            // Act
            var result = await _tripService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhuma Viagem com o ID {id} foi encontrada", result.Message);
        }

        [Fact]
        public async Task TripService_FindById_ShouldReturnEmpty_WhenFleetModuleDisabled()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindById(id);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            Assert.Equal($"Nenhuma Viagem com o ID {id} foi encontrada", result.Message);
        }

        [Fact]
        public async Task TripService_FindAll_ShouldReturnTrips_WhenDataExists()
        {
            // Arrange
            var tripsMock = _mapper.Map<IList<Trip>>(_tripListMock);
            tripsMock[0].BusinessPartner = new Individual { Name = "SER" };
            tripsMock[1].BusinessPartner = new Individual { Name = "THG" };
            _repository
                .Setup(r =>
                    r.GetAllAsync(
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Payments
                    )
                )
                .ReturnsAsync(tripsMock);

            // Act
            var result = await _tripService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal($"{_tripListMock.Count} registro(s) encontrado(s).", result.Message);
            _repository.Verify(
                r =>
                    r.GetAllAsync(
                        t => t.BusinessPartner,
                        t => t.Vehicle,
                        t => t.Driver,
                        t => t.Transaction,
                        p => p.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task TripService_FindAll_ShouldReturnEmpty_WhenFleetModuleDisabled()
        {
            // Arrange
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data);
            Assert.Equal("0 registro(s) encontrado(s).", result.Message);
        }

        [Fact]
        public async Task TripService_Update_ShouldGenerateServiceOrder_WhenTripTransitionsToClosedWithDriverAssigned()
        {
            // Arrange
            var tripId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverId = Guid.Parse("00000000-0000-0000-0000-000000000077");
            var tripDto = new TripDto
            {
                Id = tripId,
                TripNumber = "SER-V00001",
                Status = OrderStatus.Closed,
                DriverId = driverId,
                Transaction = new TransactionDto(),
            };

            var previousTrip = new Trip
            {
                Id = tripId,
                Status = OrderStatus.Open,
                DriverId = driverId,
            };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Trip, bool>>>()))
                .ReturnsAsync(new List<Trip> { previousTrip });

            // Act
            await _tripService.Update(tripDto);

            // Assert
            _serviceOrderService.Verify(
                _ => _.GenerateForTrip(It.Is<Trip>(t => t.Id == tripId)),
                Times.Once
            );
        }

        [Fact]
        public async Task TripService_Update_ShouldNotGenerateServiceOrder_WhenTripWasAlreadyClosed()
        {
            // Arrange
            var tripId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var driverId = Guid.Parse("00000000-0000-0000-0000-000000000077");
            var tripDto = new TripDto
            {
                Id = tripId,
                TripNumber = "SER-V00001",
                Status = OrderStatus.Closed,
                DriverId = driverId,
                Transaction = new TransactionDto(),
            };

            var previousTrip = new Trip
            {
                Id = tripId,
                Status = OrderStatus.Closed,
                DriverId = driverId,
            };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Trip, bool>>>()))
                .ReturnsAsync(new List<Trip> { previousTrip });

            // Act
            await _tripService.Update(tripDto);

            // Assert
            _serviceOrderService.Verify(_ => _.GenerateForTrip(It.IsAny<Trip>()), Times.Never);
        }

        [Fact]
        public async Task TripService_Update_ShouldReturnWarningAndNotUpdate_WhenTripBelongsToAnotherUserAndCurrentUserIsNotAdmin()
        {
            // Arrange
            var tripId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var tripDto = new TripDto
            {
                Id = tripId,
                TripNumber = "SER-V00001",
                Transaction = new TransactionDto(),
            };

            var existingTrip = new Trip { Id = tripId, CreateUserId = "owner-user-id" };

            _repository
                .Setup(r => r.QueryAsync(It.IsAny<Expression<Func<Trip, bool>>>()))
                .ReturnsAsync(new List<Trip> { existingTrip });

            _currentUserService.Setup(_ => _.IsInRole("Admin")).Returns(false);
            _currentUserService.Setup(_ => _.GetUserId()).Returns("another-user-id");

            // Act
            var result = await _tripService.Update(tripDto);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Trip>()), Times.Never);
        }

        [Fact]
        public async Task TripService_FindByTripNumber_ShouldReturnNoData_WhenFleetModuleDisabled()
        {
            // Arrange
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindByTripNumber("SER-V00001");

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
            _repository.Verify(
                r =>
                    r.FirstOrDefaultAsync(
                        It.IsAny<Expression<Func<Trip, bool>>>(),
                        It.IsAny<Expression<Func<Trip, object>>[]>()
                    ),
                Times.Never
            );
        }

        [Fact]
        public async Task TripService_FindByBusinessPartnerId_ShouldReturnEmpty_WhenFleetModuleDisabled()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data);
        }

        [Fact]
        public async Task TripService_FindByDriverId_ShouldReturnEmpty_WhenFleetModuleDisabled()
        {
            // Arrange
            var driverId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindByDriverId(driverId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data);
        }

        [Fact]
        public async Task TripService_FindByVehicleId_ShouldReturnEmpty_WhenFleetModuleDisabled()
        {
            // Arrange
            var vehicleId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            _featureToggleService
                .Setup(_ => _.IsEnabledAsync(FeatureToggleKeys.Trip, FeatureToggleKeys.FleetModule))
                .ReturnsAsync(false);

            // Act
            var result = await _tripService.FindByVehicleId(vehicleId);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Empty(result.Data);
        }
    }
}
