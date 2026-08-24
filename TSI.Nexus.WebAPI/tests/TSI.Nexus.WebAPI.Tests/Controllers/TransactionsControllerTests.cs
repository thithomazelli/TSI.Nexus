using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;
using TSI.Nexus.WebAPI.Controllers;

namespace TSI.Nexus.WebAPI.Tests.Controllers
{
    public class TransactionsControllerTests
    {
        private readonly TransactionsController _controller;
        private readonly Mock<ITransactionService> _serviceMock;
        private readonly IList<TransactionDto> _transactionsMock;

        public TransactionsControllerTests()
        {
            _serviceMock = new Mock<ITransactionService>();
            _controller = new TransactionsController(_serviceMock.Object);

            _transactionsMock = new List<TransactionDto>
            {
                new TransactionDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Description = "Transação1",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
                new TransactionDto
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Description = "Transação2",
                    BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    OrderId = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                },
            };
        }

        [Fact]
        public async Task GetByBusinessPartnerId_ShouldReturnOkWithTransactions_WhenServiceReturnsTransactions()
        {
            // Arrange
            var businessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transactions = _transactionsMock
                .Where(p => p.BusinessPartnerId == businessPartnerId)
                .ToList();
            var expected = new WebApiResponse<IEnumerable<TransactionDto>>
            {
                Data = transactions,
                Status = ResponseStatus.Success,
                Message = $"{transactions.Count} registro(s) encontrado(s).",
            };

            _serviceMock
                .Setup(s => s.FindByBusinessPartnerId(businessPartnerId))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByBusinessPartnerId(businessPartnerId);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<TransactionDto>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindByBusinessPartnerId(businessPartnerId), Times.Once);
        }

        [Fact]
        public async Task GetById_ShouldReturnOkWithTransaction_WhenServiceReturnsTransaction()
        {
            // Arrange
            var id = Guid.Parse("00000000-0000-0000-0000-000000000001");
            var transaction = _transactionsMock.First(p => p.Id == id);
            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transaction,
                Status = ResponseStatus.Success,
                Message = $"Transação {transaction.Description} encontrado com sucesso",
            };

            _serviceMock.Setup(s => s.FindById(id)).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetById(id);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TransactionDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.FindById(id), Times.Once);
        }

        [Fact]
        public async Task Add_ShouldReturnOkWithCreatedTransaction_WhenModelIsValid()
        {
            // Arrange
            var transaction = new TransactionDto
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Description = "Transação3",
                BusinessPartnerId = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                OrderId = Guid.Parse("00000000-0000-0000-0000-000000000002"),
            };
            var expected = new WebApiResponse<TransactionDto>
            {
                Data = transaction,
                Status = ResponseStatus.Success,
                Message = $"Transação {transaction.Description} cadastrado com sucesso.",
            };

            _serviceMock.Setup(s => s.Add(transaction)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(transaction);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<TransactionDto>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _serviceMock.Verify(s => s.Add(transaction), Times.Once);
        }
    }
}
