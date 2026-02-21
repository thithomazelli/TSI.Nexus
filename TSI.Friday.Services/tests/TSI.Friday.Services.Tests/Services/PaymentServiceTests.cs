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

namespace TSI.Friday.Services.Tests.Services
{
    public class PaymentServiceTests
    {
        private readonly PaymentService _paymentService;
        private readonly Mock<IRepository<Payment>> _repository;
        private readonly IList<PaymentDto> _paymentsMock;
        private readonly IMapper _mapper;

        public PaymentServiceTests()
        {
            _repository = new Mock<IRepository<Payment>>();
            var config = new MapperConfiguration(cfg => cfg.AddProfile<MappingProfile>());
            _mapper = config.CreateMapper();
            _paymentService = new PaymentService(_repository.Object, _mapper);

            _paymentsMock = new List<PaymentDto>
            {
                new PaymentDto
                {
                    Id = 1,
                    Description = "Pagamento 1",
                    BusinessPartnerId = 1,
                    OrderId = 1,
                    Status = PaymentStatus.Pending,
                },
                new PaymentDto
                {
                    Id = 2,
                    Description = "Pagamento 2",
                    BusinessPartnerId = 2,
                    OrderId = 1,
                },
            };
        }

        [Fact]
        public async Task PaymentService_Add_ShouldAddPaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = new PaymentDto
            {
                Id = 3,
                Description = "Pagamento 3",
                BusinessPartnerId = 3,
                OrderId = 2,
            };
            _repository.Setup(r => r.AddAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} cadastrado com sucesso.",
            };

            // Act
            var result = await _paymentService.Add(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.AddAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_Update_ShouldUpdatePaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _paymentsMock.First();
            var paymentEntity = _mapper.Map<Payment>(paymentDto);

            _repository
                .Setup(_ => _.GetByIdAsync(It.IsAny<int>(), p => p.Installments))
                .ReturnsAsync(paymentEntity);
            _repository.Setup(_ => _.UpdateAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} atualizado com sucesso.",
            };

            // Act
            var result = await _paymentService.Update(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_Remove_ShouldRemovePaymentSuccessfully_WhenMethodIsCalledWithAValidObject()
        {
            // Arrange
            var paymentDto = _paymentsMock.First();

            _repository.Setup(r => r.RemoveAsync(It.IsAny<Payment>())).Returns(Task.CompletedTask);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} removido com sucesso.",
            };

            // Act
            var result = await _paymentService.Remove(paymentDto);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<Payment>()), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindById_ShouldReturnPayment_WhenIdIsValid()
        {
            // Arrange
            const int id = 1;
            var paymentDto = _paymentsMock.First(p => p.Id == id);
            var paymentEntity = _mapper.Map<Payment>(paymentDto);

            _repository
                .Setup(r => r.GetByIdAsync(id, p => p.Installments))
                .ReturnsAsync(paymentEntity);

            var expected = new WebApiResponse<PaymentDto>
            {
                Data = paymentDto,
                Status = ResponseStatus.Success,
                Message = $"Pagamento {paymentDto.Description} encontrado com sucesso",
            };

            // Act
            var result = await _paymentService.FindById(id);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(r => r.GetByIdAsync(id, p => p.Installments), Times.Once);
        }

        [Fact]
        public async Task PaymentService_FindByBusinessPartnerId_ShouldReturnPayments_WhenBusinessPartnerIdIsValid()
        {
            // Arrange
            const int businessPartnerId = 1;
            var paymentDtoList = _paymentsMock
                .Where(p => p.BusinessPartnerId == businessPartnerId)
                .ToList();
            var paymentEntityList = _mapper.Map<IList<Payment>>(paymentDtoList);
            _repository
                .Setup(_ =>
                    _.QueryAsync(It.IsAny<Expression<Func<Payment, bool>>>(), p => p.Installments)
                )
                .ReturnsAsync(paymentEntityList);

            var expected = new WebApiResponse<IEnumerable<PaymentDto>>
            {
                Data = paymentDtoList,
                Status = ResponseStatus.Success,
                Message = $"{paymentDtoList.Count} registro(s) encontrado(s).",
            };

            // Act
            var result = await _paymentService.FindByBusinessPartnerId(businessPartnerId);

            // Assert
            expected.Should().BeEquivalentTo(result);
            _repository.Verify(
                r => r.QueryAsync(It.IsAny<Expression<Func<Payment, bool>>>(), p => p.Installments),
                Times.Once
            );
        }
    }
}
