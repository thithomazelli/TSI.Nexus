using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Services.Tests.Services
{
    public class DocumentTemplateServiceTests
    {
        private readonly DocumentTemplateService _service;
        private readonly Mock<IRepository<DocumentTemplate>> _repository;
        private readonly Mock<ILogService> _logServiceMock;

        public DocumentTemplateServiceTests()
        {
            _repository = new Mock<IRepository<DocumentTemplate>>();
            _logServiceMock = new Mock<ILogService>();
            _service = new DocumentTemplateService(_repository.Object, _logServiceMock.Object);
        }

        [Fact]
        public async Task DocumentTemplateService_Add_ShouldAddTemplateSuccessfully_WhenTypeIsNotYetRegistered()
        {
            // Arrange
            var documentTemplate = new DocumentTemplate
            {
                Type = DocumentTemplateType.Quote,
                Name = "Orçamento",
                FileName = "orcamento.html",
                Content = "<h1>Orçamento</h1>",
            };

            _repository
                .Setup(r => r.AnyAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync(false);
            _repository
                .Setup(r => r.AddAsync(It.IsAny<DocumentTemplate>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.Add(documentTemplate);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(r => r.AddAsync(It.IsAny<DocumentTemplate>()), Times.Once);
        }

        [Fact]
        public async Task DocumentTemplateService_Add_ShouldReturnWarningAndNotAdd_WhenTypeAlreadyRegistered()
        {
            // Arrange
            var documentTemplate = new DocumentTemplate
            {
                Type = DocumentTemplateType.Quote,
                Name = "Orçamento",
                FileName = "orcamento.html",
                Content = "<h1>Orçamento</h1>",
            };

            _repository
                .Setup(r => r.AnyAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync(true);

            // Act
            var result = await _service.Add(documentTemplate);

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.AddAsync(It.IsAny<DocumentTemplate>()), Times.Never);
        }

        [Fact]
        public async Task DocumentTemplateService_FindByType_ShouldReturnTemplate_WhenTypeIsRegistered()
        {
            // Arrange
            var documentTemplate = new DocumentTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = DocumentTemplateType.Contract,
                Name = "Contrato de Fretamento",
                FileName = "contrato.html",
                Content = "<h1>Contrato</h1>",
            };

            _repository
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync(documentTemplate);

            // Act
            var result = await _service.FindByType(DocumentTemplateType.Contract);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(documentTemplate, result.Data);
        }

        [Fact]
        public async Task DocumentTemplateService_FindByType_ShouldReturnNoData_WhenTypeIsNotRegistered()
        {
            // Arrange
            _repository
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync((DocumentTemplate)null);

            // Act
            var result = await _service.FindByType(DocumentTemplateType.SalesOrder);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Null(result.Data);
        }

        [Fact]
        public async Task DocumentTemplateService_UploadContent_ShouldReplaceFileNameAndContent_WhenTypeIsRegistered()
        {
            // Arrange
            var documentTemplate = new DocumentTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = DocumentTemplateType.ServiceOrder,
                Name = "Ordem de Serviço",
                FileName = "old-file.html",
                Content = "<h1>Old</h1>",
            };

            _repository
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync(documentTemplate);
            _repository
                .Setup(r => r.UpdateAsync(It.IsAny<DocumentTemplate>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.UploadContent(
                DocumentTemplateType.ServiceOrder,
                "new-file.html",
                "<h1>New</h1>"
            );

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal("new-file.html", result.Data.FileName);
            Assert.Equal("<h1>New</h1>", result.Data.Content);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<DocumentTemplate>()), Times.Once);
        }

        [Fact]
        public async Task DocumentTemplateService_UploadContent_ShouldReturnWarning_WhenTypeIsNotRegistered()
        {
            // Arrange
            _repository
                .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<DocumentTemplate, bool>>>()))
                .ReturnsAsync((DocumentTemplate)null);

            // Act
            var result = await _service.UploadContent(
                DocumentTemplateType.SalesOrder,
                "file.html",
                "<h1>Conteúdo</h1>"
            );

            // Assert
            Assert.Equal(ResponseStatus.Warning, result.Status);
            _repository.Verify(r => r.UpdateAsync(It.IsAny<DocumentTemplate>()), Times.Never);
        }

        [Fact]
        public async Task DocumentTemplateService_FindAll_ShouldReturnAllTemplates()
        {
            // Arrange
            var templates = new List<DocumentTemplate>
            {
                new DocumentTemplate { Type = DocumentTemplateType.Quote, Name = "Orçamento" },
                new DocumentTemplate { Type = DocumentTemplateType.Contract, Name = "Contrato" },
            };

            _repository.Setup(r => r.GetAllAsync()).ReturnsAsync(templates);

            // Act
            var result = await _service.FindAll();

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            Assert.Equal(2, result.Data.Count());
        }

        [Fact]
        public async Task DocumentTemplateService_Remove_ShouldRemoveTemplateSuccessfully()
        {
            // Arrange
            var documentTemplate = new DocumentTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                Type = DocumentTemplateType.Quote,
                Name = "Orçamento",
            };

            _repository
                .Setup(r => r.RemoveAsync(It.IsAny<DocumentTemplate>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.Remove(documentTemplate);

            // Assert
            Assert.Equal(ResponseStatus.Success, result.Status);
            _repository.Verify(r => r.RemoveAsync(It.IsAny<DocumentTemplate>()), Times.Once);
        }
    }
}
