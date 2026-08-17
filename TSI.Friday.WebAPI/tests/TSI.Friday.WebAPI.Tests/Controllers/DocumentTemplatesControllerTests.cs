using FluentAssertions;
using Microsoft.AspNetCore.Mvc;
using Moq;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;
using TSI.Friday.WebAPI.Controllers;

namespace TSI.Friday.WebAPI.Tests.Controllers
{
    public class DocumentTemplatesControllerTests
    {
        private readonly DocumentTemplatesController _controller;
        private readonly Mock<IDocumentTemplateService> _documentTemplateServiceMock;
        private readonly IList<DocumentTemplate> _templatesMock;

        public DocumentTemplatesControllerTests()
        {
            _documentTemplateServiceMock = new Mock<IDocumentTemplateService>();
            _controller = new DocumentTemplatesController(_documentTemplateServiceMock.Object);

            _templatesMock = new List<DocumentTemplate>
            {
                new DocumentTemplate
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"),
                    Type = DocumentTemplateType.Quote,
                    Name = "Orçamento",
                    FileName = "orcamento.html",
                    Content = "<h1>Orçamento</h1>",
                },
                new DocumentTemplate
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000002"),
                    Type = DocumentTemplateType.Contract,
                    Name = "Contrato de Fretamento",
                    FileName = "contrato.html",
                    Content = "<h1>Contrato</h1>",
                },
            };
        }

        [Fact]
        public async Task GetAll_ShouldReturnOkWithData_WhenServiceReturnsTemplates()
        {
            // Arrange
            var expected = new WebApiResponse<IEnumerable<DocumentTemplate>>
            {
                Data = _templatesMock,
                Status = ResponseStatus.Success,
                Message = $"{_templatesMock.Count} registro(s) encontrado(s).",
            };

            _documentTemplateServiceMock.Setup(s => s.FindAll()).ReturnsAsync(expected);

            // Act
            var result = await _controller.GetAll();

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<IEnumerable<DocumentTemplate>>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _documentTemplateServiceMock.Verify(s => s.FindAll(), Times.Once);
        }

        [Fact]
        public async Task GetByType_ShouldReturnOkWithTemplate_WhenServiceReturnsTemplate()
        {
            // Arrange
            var template = _templatesMock.First(t => t.Type == DocumentTemplateType.Quote);
            var expected = new WebApiResponse<DocumentTemplate>
            {
                Data = template,
                Status = ResponseStatus.Success,
                Message = $"Template {template.Name} encontrado com sucesso",
            };

            _documentTemplateServiceMock
                .Setup(s => s.FindByType(DocumentTemplateType.Quote))
                .ReturnsAsync(expected);

            // Act
            var result = await _controller.GetByType(DocumentTemplateType.Quote);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<DocumentTemplate>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _documentTemplateServiceMock.Verify(
                s => s.FindByType(DocumentTemplateType.Quote),
                Times.Once
            );
        }

        [Fact]
        public async Task Add_ShouldReturnOkWithCreatedTemplate_WhenModelIsValid()
        {
            // Arrange
            var template = new DocumentTemplate
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000003"),
                Type = DocumentTemplateType.SalesOrder,
                Name = "Pedido de Venda",
                FileName = "pedido-de-venda.html",
                Content = "<h1>Pedido de Venda</h1>",
            };
            var expected = new WebApiResponse<DocumentTemplate>
            {
                Data = template,
                Status = ResponseStatus.Success,
                Message = $"Template {template.Name} cadastrado com sucesso.",
            };

            _documentTemplateServiceMock.Setup(s => s.Add(template)).ReturnsAsync(expected);

            // Act
            var result = await _controller.Add(template);

            // Assert
            var ok = Assert.IsType<OkObjectResult>(result);
            var response = Assert.IsType<WebApiResponse<DocumentTemplate>>(ok.Value);
            response.Should().BeEquivalentTo(expected);
            _documentTemplateServiceMock.Verify(s => s.Add(template), Times.Once);
        }
    }
}
