using System.Collections.Generic;
using FluentAssertions;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Contracts.Tests.Models
{
    public class SelectableOptionTests
    {
        [Fact]
        public void Properties_CanBeSetAndRetrieved()
        {
            var events = new List<Event> { new Event() };

            var option = new SelectableOption
            {
                Group = SelectableOptionGroup.EventType,
                Value = "Reunião",
                Color = "#FF0000",
                Events = events,
            };

            option.Group.Should().Be(SelectableOptionGroup.EventType);
            option.Value.Should().Be("Reunião");
            option.Color.Should().Be("#FF0000");
            option.Events.Should().BeSameAs(events);
        }

        [Fact]
        public void DefaultConstructor_ValueDefaultsToEmpty()
        {
            var option = new SelectableOption();

            option.Value.Should().BeEmpty();
            option.Color.Should().BeNull();
        }
    }
}
