using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Contracts.Utilities;

namespace TSI.Friday.Contracts.Interfaces
{
    /// <summary>
    /// Defines methods for managing the module feature toggles that only the Master role can
    /// change, and for other services to cheaply check whether a module is currently enabled
    /// before including its records in a response.
    /// </summary>
    public interface IFeatureToggleService
    {
        /// <summary>
        /// Method responsible to get all registers available on the feature toggle database.
        /// </summary>
        /// <returns>All registers found on the feature toggle database.</returns>
        Task<WebApiResponse<IEnumerable<FeatureToggle>>> FindAll();

        /// <summary>
        /// Method responsible to get only one FeatureToggle based on the Key received as parameter.
        /// </summary>
        /// <param name="key">The Key to be used on the search. See <see cref="FeatureToggleKeys"/>.</param>
        /// <returns>One FeatureToggle object according to the Key defined as parameter.</returns>
        Task<WebApiResponse<FeatureToggle>> FindByKey(string key);

        /// <summary>
        /// Enables or disables the module identified by the given Key. Only the Master role may
        /// call this (enforced by the <c>RequireMaster</c> policy at the controller level).
        /// </summary>
        /// <param name="key">The Key of the module being toggled. See <see cref="FeatureToggleKeys"/>.</param>
        /// <param name="enabled">The new Enabled state.</param>
        /// <returns>The updated FeatureToggle.</returns>
        Task<WebApiResponse<FeatureToggle>> SetEnabled(string key, bool enabled);

        /// <summary>
        /// Cheap check used by other services before including a module's records in a response.
        /// Returns true (fails open) when the toggle isn't registered, so a missing seed never
        /// hides an otherwise unrelated module by accident.
        /// </summary>
        /// <param name="key">The Key of the module being checked. See <see cref="FeatureToggleKeys"/>.</param>
        /// <returns>Whether the module is currently enabled.</returns>
        Task<bool> IsEnabledAsync(string key);
    }
}
