using System;
using FluentAssertions;
using Microsoft.AspNetCore.Http;
using Moq;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.Contracts.Tests.Models.DTOs
{
    public class PhotoUploadDtoTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var file = Mock.Of<IFormFile>();
            var entityId = Guid.NewGuid();

            var dto = new PhotoUploadDto
            {
                Entity = "Driver",
                EntityId = entityId,
                File = file,
            };

            dto.Entity.Should().Be("Driver");
            dto.EntityId.Should().Be(entityId);
            dto.File.Should().BeSameAs(file);
        }
    }
}
