using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// Defines methods for managing the admin-editable values behind the app's dropdown option
    /// lists (address type, product category, transaction category).
    /// </summary>
    public interface ISelectableOptionService
    {
        /// <summary>
        /// Add a new SelectableOption based on the object received.
        /// </summary>
        /// <param name="option">The option object defined.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<SelectableOption>> Add(SelectableOption option);

        /// <summary>
        /// Update a SelectableOption based on the object received.
        /// </summary>
        /// <param name="option">The option object updated.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<SelectableOption>> Update(SelectableOption option);

        /// <summary>
        /// Remove a SelectableOption based on the object received.
        /// </summary>
        /// <param name="option">The option object to be removed.</param>
        /// <returns>Return an WebApiResponse with the results for this operation.</returns>
        Task<WebApiResponse<SelectableOption>> Remove(SelectableOption option);

        /// <summary>
        /// Method responsible to get all registers available on the selectable option database.
        /// </summary>
        /// <returns>All registers found on the selectable option database.</returns>
        Task<WebApiResponse<IEnumerable<SelectableOption>>> FindAll();

        /// <summary>
        /// Method responsible to get all registers of a given group.
        /// </summary>
        /// <param name="group">The SelectableOptionGroup to be used on the search.</param>
        /// <returns>All registers found for the given group.</returns>
        Task<WebApiResponse<IEnumerable<SelectableOption>>> FindByGroup(
            SelectableOptionGroup group
        );
    }
}
