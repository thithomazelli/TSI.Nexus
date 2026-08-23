using System.Linq.Expressions;
using AutoMapper;
using FluentAssertions;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Models.DTOs;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.IoC;
using Microsoft.Extensions.Logging;

namespace TSI.Friday.Services.Tests.Services
{
    public class EventParticipantServiceTests
    {
        private readonly EventParticipantService _eventParticipantService;
        private readonly Mock<IRepository<EventParticipant>> _repository;
        private readonly Mock<IRepository<User>> _userRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IMapper _mapper;

        public EventParticipantServiceTests()
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

            _repository = new Mock<IRepository<EventParticipant>>();
            _userRepository = new Mock<IRepository<User>>();
            _logService = new Mock<ILogService>();

            _eventParticipantService = new EventParticipantService(
                _repository.Object,
                _userRepository.Object,
                _mapper,
                _logService.Object
            );
        }

        [Fact]
        public async Task EventParticipantService_Add_ShouldRejectItem_WhenNeitherUserNorContactIsSet()
        {
            // Arrange
            var dto = new EventParticipantDto { EventId = Guid.NewGuid() };

            // Act
            var result = await _eventParticipantService.Add(dto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Error);
            _repository.Verify(r => r.AddAsync(It.IsAny<EventParticipant>()), Times.Never);
        }

        [Fact]
        public async Task EventParticipantService_Add_ShouldAddItemSuccessfully_WhenUserIdIsSet()
        {
            // Arrange
            var dto = new EventParticipantDto
            {
                EventId = Guid.NewGuid(),
                UserId = "user-1",
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<EventParticipant>()))
                .Returns(Task.CompletedTask);
            _userRepository
                .Setup(r => r.GetByIdAsync(It.IsAny<object>()))
                .ReturnsAsync(new User { FirstName = "Ana", LastName = "Silva" });

            // Act
            var result = await _eventParticipantService.Add(dto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.DisplayName.Should().Be("Ana Silva");
            _repository.Verify(r => r.AddAsync(It.IsAny<EventParticipant>()), Times.Once);
        }

        [Fact]
        public async Task EventParticipantService_Add_ShouldAddItemSuccessfully_WhenFreeformContactIsSet()
        {
            // Arrange
            var dto = new EventParticipantDto
            {
                EventId = Guid.NewGuid(),
                Name = "Fornecedor Externo",
                Email = "contato@fornecedor.com",
            };
            _repository
                .Setup(r => r.AddAsync(It.IsAny<EventParticipant>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _eventParticipantService.Add(dto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.DisplayName.Should().Be("Fornecedor Externo");
            _repository.Verify(r => r.AddAsync(It.IsAny<EventParticipant>()), Times.Once);
        }

        [Fact]
        public async Task EventParticipantService_Remove_ShouldRemoveItemSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var dto = new EventParticipantDto { Id = Guid.NewGuid() };
            _repository
                .Setup(r => r.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(new EventParticipant());
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<EventParticipant>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _eventParticipantService.Remove(dto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<EventParticipant>()), Times.Once);
        }

        [Fact]
        public async Task EventParticipantService_FindByEventId_ShouldReturnItems_WhenEventIdIsValid()
        {
            // Arrange
            var eventId = Guid.NewGuid();
            var items = new List<EventParticipant>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    EventId = eventId,
                    Name = "Convidado Externo",
                    Email = "convidado@exemplo.com",
                },
            };
            _repository
                .Setup(r =>
                    r.QueryAsync(It.IsAny<Expression<Func<EventParticipant, bool>>>())
                )
                .ReturnsAsync(items);

            // Act
            var result = await _eventParticipantService.FindByEventId(eventId);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            result.Data.Should().ContainSingle(p => p.DisplayName == "Convidado Externo");
        }
    }
}
