using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface IQuoteTripLegService
    {
        /// <summary>
        /// Add a new QuoteTripLeg based on the object received.
        /// </summary>
        /// <param name="quoteTripLeg">The quote trip leg object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteTripLeg>> Add(QuoteTripLeg quoteTripLeg);

        /// <summary>
        /// Update a QuoteTripLeg based on the object received.
        /// </summary>
        /// <param name="quoteTripLeg">The quote trip leg object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteTripLeg>> Update(QuoteTripLeg quoteTripLeg);

        /// <summary>
        /// Remove a QuoteTripLeg based on the object received.
        /// </summary>
        /// <param name="quoteTripLeg">The quote trip leg object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<QuoteTripLeg>> Remove(QuoteTripLeg quoteTripLeg);

        /// <summary>
        /// Method responsible to get only one QuoteTripLeg based on the ID received as parameter.
        /// </summary>
        /// <param name="id">The ID to be used on the search.</param>
        /// <returns>One QuoteTripLeg object according to the ID defined as parameter.</returns>
        Task<WebApiResponse<QuoteTripLeg>> FindById(Guid? id);

        /// <summary>
        /// Method responsible to get all QuoteTripLegs registered for a given QuoteTrip, ordered by
        /// SequenceNumber.
        /// </summary>
        /// <param name="quoteTripId">The QuoteTrip ID to be used on the search.</param>
        /// <returns>All QuoteTripLegs found for the QuoteTrip.</returns>
        Task<WebApiResponse<IEnumerable<QuoteTripLeg>>> FindByQuoteTrip(Guid quoteTripId);
    }
}
