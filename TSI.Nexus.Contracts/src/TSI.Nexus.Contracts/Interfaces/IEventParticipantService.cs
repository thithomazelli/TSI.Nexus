using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models.DTOs;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IEventParticipantService
    {
        /// <summary>
        /// Add a new EventParticipant based on the object received. Rejects the request unless
        /// exactly one of UserId or Name/Email identifies the participant.
        /// </summary>
        /// <param name="eventParticipantDto">The eventParticipant object defined.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<EventParticipantDto>> Add(EventParticipantDto eventParticipantDto);

        /// <summary>
        /// Remove an EventParticipant based on the object received.
        /// </summary>
        /// <param name="eventParticipantDto">The eventParticipant object to be removed.</param>
        /// <returns>Return an WebApiReponse with the results for this operation.</returns>
        Task<WebApiResponse<EventParticipantDto>> Remove(EventParticipantDto eventParticipantDto);

        /// <summary>
        /// Method responsible to get a list of EventParticipants based on the EventId received as
        /// parameter.
        /// </summary>
        /// <param name="eventId">The ID to be used on the search.</param>
        Task<WebApiResponse<IEnumerable<EventParticipantDto>>> FindByEventId(Guid? eventId);
    }
}
