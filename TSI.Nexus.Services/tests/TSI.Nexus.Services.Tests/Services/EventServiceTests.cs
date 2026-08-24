using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.IoC;
using Microsoft.Extensions.Logging;

namespace TSI.Nexus.Services.Tests.Services
{
    public class EventServiceTests
    {
        private readonly EventService _eventService;
        private readonly Mock<IRepository<Event>> _repository;
        private readonly Mock<IRepository<User>> _userRepository;
        private readonly Mock<ICurrentUserService> _currentUserService;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;

        public EventServiceTests()
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

            _repository = new Mock<IRepository<Event>>();
            _userRepository = new Mock<IRepository<User>>();
            _currentUserService = new Mock<ICurrentUserService>();
            _logService = new Mock<ILogService>();

            _currentUserService.Setup(c => c.GetUserId()).Returns("current-user-id");
            _userRepository
                .Setup(r =>
                    r.QueryAsync(It.IsAny<Expression<Func<User, bool>>>())
                )
                .ReturnsAsync(new List<User>());

            _eventService = new EventService(
                _repository.Object,
                _userRepository.Object,
                _currentUserService.Object,
                _mapper,
                _logService.Object
            );
        }

        [Fact]
        public async Task EventService_Add_ShouldRejectItem_WhenNoLinkIsSet()
        {
            // Arrange
            var eventDto = new EventDto { Title = "Reunião", EventTypeOptionId = Guid.NewGuid() };

            // Act
            var result = await _eventService.Add(eventDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Error);
            _repository.Verify(r => r.AddAsync(It.IsAny<Event>()), Times.Never);
        }

        [Fact]
        public async Task EventService_Add_ShouldAddItemSuccessfully_WhenLinkedToAnEntity()
        {
            // Arrange
            var eventDto = new EventDto
            {
                Title = "Reunião com cliente",
                EventTypeOptionId = Guid.NewGuid(),
                StartDate = DateTime.UtcNow,
                EndDate = DateTime.UtcNow.AddHours(1),
                BusinessPartnerId = Guid.NewGuid(),
            };
            _repository.Setup(r => r.AddAsync(It.IsAny<Event>())).Returns(Task.CompletedTask);

            // Act
            var result = await _eventService.Add(eventDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.CreatedByUserId.Should().Be("current-user-id");
            _repository.Verify(r => r.AddAsync(It.IsAny<Event>()), Times.Once);
        }

        [Fact]
        public async Task EventService_Update_ShouldRejectItem_WhenNoLinkIsSet()
        {
            // Arrange
            var eventDto = new EventDto { Id = Guid.NewGuid(), Title = "Reunião" };

            // Act
            var result = await _eventService.Update(eventDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Error);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Event>()), Times.Never);
        }

        [Fact]
        public async Task EventService_Update_ShouldUpdateItemSuccessfully_WhenLinkedToAnEntity()
        {
            // Arrange
            var eventDto = new EventDto
            {
                Id = Guid.NewGuid(),
                Title = "Reunião",
                OrderId = Guid.NewGuid(),
            };
            _repository.Setup(r => r.UpdateAsync(It.IsAny<Event>())).Returns(Task.CompletedTask);

            // Act
            var result = await _eventService.Update(eventDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Event>()), Times.Once);
        }

        [Fact]
        public async Task EventService_Remove_ShouldRemoveItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var eventDto = new EventDto { Id = Guid.NewGuid(), Title = "Reunião" };
            _repository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new Event());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<Event>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _eventService.Remove(eventDto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Event>()), Times.Once);
        }

        [Fact]
        public async Task EventService_FindById_ShouldReturnItem_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.NewGuid();
            var entity = new Event { Id = id, Title = "Reunião", OrderId = Guid.NewGuid() };
            _repository
                .Setup(r =>
                    r.GetByIdAsync(
                        It.IsAny<object>(),
                        It.IsAny<Expression<Func<Event, object>>[]>()
                    )
                )
                .ReturnsAsync(entity);

            // Act
            var result = await _eventService.FindById(id);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.Title.Should().Be("Reunião");
        }

        [Fact]
        public async Task EventService_FindByOrderId_ShouldReturnItems_WhenOrderIdIsValid()
        {
            // Arrange
            var orderId = Guid.NewGuid();
            var items = new List<Event>
            {
                new() { Id = Guid.NewGuid(), Title = "Entrega", OrderId = orderId },
            };
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Event, bool>>>(),
                        It.IsAny<Expression<Func<Event, object>>[]>()
                    )
                )
                .ReturnsAsync(items);

            // Act
            var result = await _eventService.FindByOrderId(orderId);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.Should().ContainSingle(e => e.Title == "Entrega");
        }

        [Fact]
        public async Task EventService_FindByUserId_ShouldReturnItems_WhenUserIdIsValid()
        {
            // Arrange
            const string userId = "user-1";
            var items = new List<Event>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Title = "Follow-up",
                    CreatedByUserId = userId,
                    VehicleId = Guid.NewGuid(),
                },
            };
            _repository
                .Setup(r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Event, bool>>>(),
                        It.IsAny<Expression<Func<Event, object>>[]>()
                    )
                )
                .ReturnsAsync(items);

            // Act
            var result = await _eventService.FindByUserId(userId);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.Should().ContainSingle(e => e.Title == "Follow-up");
        }
    }
}
