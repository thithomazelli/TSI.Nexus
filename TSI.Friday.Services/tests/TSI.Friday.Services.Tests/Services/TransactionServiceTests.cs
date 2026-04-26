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
    public class TransactionServiceTests
    {
        private readonly TransactionService _transactionService;
        private readonly Mock<IRepository<Transaction>> _repository;
        private readonly Mock<IRepository<Payment>> _paymentRepository;
        private readonly Mock<ILogService> _logService;
        private readonly IList<TransactionDto> _transactionsMock;
        private readonly IMapper _mapper;

        public TransactionServiceTests()
        {
            _repository = new Mock<IRepository<Transaction>>();
            _paymentRepository = new Mock<IRepository<Payment>>();
            _logService = new Mock<ILogService>();
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _mapper = config.CreateMapper();
            _transactionService = new TransactionService(
                _repository.Object,
                _paymentRepository.Object,
                _mapper,
                _logService.Object
            );

            _transactionsMock = new List<TransactionDto>
            {
                new TransactionDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Transação 1",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Status = PaymentStatus.Pending,
                },
                new TransactionDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Transação 2",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Status = PaymentStatus.Pending,
                },
            };
        }

        [Fact]
        public async Task TransactionService_Add_ShouldAddTransactionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var transactionDto = new TransactionDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Transação 3",
                BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            };
            _repository.Setup(r => r.AddAsync(It.IsAny<Transaction>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transactionDto,
                Status = ResponseStatus.Success,
                Message = $"Transação {transactionDto.Description} cadastrado com sucesso.",
            };

            // Act
            var result = await _transactionService.Add(transactionDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<Transaction>()), Times.Once);
        }

        [Fact]
        public async Task TransactionService_Update_ShouldUpdateTransactionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var transactionDto = _transactionsMock.First();
            var transactionEntity = _mapper.Map<Transaction>(transactionDto);

            _repository
                .Setup(_ => _.GetByIdAsync(It.IsAny<Guid>(), p => p.Payments))
                .ReturnsAsync(transactionEntity);
            _repository
                .Setup(_ => _.UpdateAsync(It.IsAny<Transaction>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transactionDto,
                Status = ResponseStatus.Success,
                Message = $"Transação {transactionDto.Description} atualizado com sucesso.",
            };

            // Act
            var result = await _transactionService.Update(transactionDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Transaction>()), Times.Once);
        }

        [Fact]
        public async Task TransactionService_Remove_ShouldRemoveTransactionSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var transactionDto = _transactionsMock.First();

            _repository
                .Setup(_ => _.GetByIdAsync(It.IsAny<Guid>()))
                .ReturnsAsync(_mapper.Map<Transaction>(transactionDto));
            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<Transaction>()))
                .Returns(Task.CompletedTask);

            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transactionDto,
                Status = ResponseStatus.Success,
                Message = $"Transação {transactionDto.Description} removido com sucesso.",
            };

            // Act
            var result = await _transactionService.Remove(transactionDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Transaction>()), Times.Once);
        }

        [Fact]
        public async Task TransactionService_FindById_ShouldReturnTransaction_WhenIdIsValid()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactionDto = _transactionsMock.First(p => p.Id == id);
            var transactionEntity = _mapper.Map<Transaction>(transactionDto);

            _repository
                .Setup(r =>
                    r.GetByIdAsync(id, c => c.BusinessPartner, o => o.Order, p => p.Payments)
                )
                .ReturnsAsync(transactionEntity);

            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transactionDto,
                Status = ResponseStatus.Success,
                Message = $"Transação {transactionDto.Description} encontrado com sucesso",
            };

            // Act
            var result = await _transactionService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r => r.GetByIdAsync(id, c => c.BusinessPartner, o => o.Order, p => p.Payments),
                Times.Once
            );
        }

        [Fact]
        public async Task TransactionService_FindByBusinessPartnerId_ShouldReturnTransactions_WhenBusinessPartnerIdIsValid()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactionDtoList = _transactionsMock
                .Where(p => p.BusinessPartnerId == businessPartnerId)
                .ToList();
            var transactionEntityList = _mapper.Map<IList<Transaction>>(transactionDtoList);
            _repository
                .Setup(_ =>
                    _.QueryAsync(
                        It.IsAny<Expression<Func<Transaction, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        p => p.Payments
                    )
                )
                .ReturnsAsync(transactionEntityList);

            var expected = new WebApiResponse<IEnumerable<TransactionDto>>
            {
                Data = transactionDtoList,
                Status = ResponseStatus.Success,
                Message = $"{transactionDtoList.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _transactionService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r =>
                    r.QueryAsync(
                        It.IsAny<Expression<Func<Transaction, bool>>>(),
                        c => c.BusinessPartner,
                        o => o.Order,
                        p => p.Payments
                    ),
                Times.Once
            );
        }

        [Fact]
        public async Task TransactionService_Update_WhenMarkAllPaymentsAsApproved_CallsExecuteUpdateOnPaymentRepository()
        {
            // Arrange
            var txId = Guid.NewGuid();
            var transactionEntity = new Transaction
            {
                Id = txId,
                Payments = new List<Payment>
                {
                    new Payment
                    {
                        Id = Guid.NewGuid(),
                        Status = PaymentStatus.Pending,
                        TransactionId = txId,
                    },
                    new Payment
                    {
                        Id = Guid.NewGuid(),
                        Status = PaymentStatus.Delayed,
                        TransactionId = txId,
                    },
                },
            };

            _repository
                .Setup(r =>
                    r.GetByIdAsync(txId, It.IsAny<Expression<Func<Transaction, object>>[]>())
                )
                .ReturnsAsync(transactionEntity);

            _paymentRepository
                .Setup(r =>
                    r.ExecuteUpdateAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        It.IsAny<Action<Payment>>()
                    )
                )
                .ReturnsAsync(2);

            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<Transaction>()))
                .Returns(Task.CompletedTask);

            var dto = new TransactionDto
            {
                Id = txId,
                MarkAllPaymentsAsApproved = true,
                Description = "Tx",
            };

            // Act
            var result = await _transactionService.Update(dto);

            // Assert
            result.Status.Should().Be(ResponseStatus.Success);
            _paymentRepository.Verify(
                r =>
                    r.ExecuteUpdateAsync(
                        It.IsAny<Expression<Func<Payment, bool>>>(),
                        It.IsAny<Action<Payment>>()
                    ),
                Times.Once
            );
        }
    }
}
