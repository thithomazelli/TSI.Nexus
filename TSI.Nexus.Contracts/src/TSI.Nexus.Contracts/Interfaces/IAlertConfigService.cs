using System.Collections.Generic;
using System.Threading.Tasks;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Utilities;

namespace TSI.Nexus.Contracts.Interfaces
{
    /// <summary>
    /// Defines methods for managing the automated alert configurations that only the Master role
    /// can change, and for the services that run those alerts to cheaply check whether they're
    /// enabled - and how many days ahead to warn - before acting.
    /// </summary>
    public interface IAlertConfigService
    {
        /// <summary>
        /// Method responsible to get all registers available on the alert config database.
        /// </summary>
        Task<WebApiResponse<IEnumerable<AlertConfig>>> FindAll();

        /// <summary>
        /// Enables or disables the alert identified by the given Key. Only the Master role may
        /// call this (enforced by the <c>RequireMaster</c> policy at the controller level).
        /// </summary>
        Task<WebApiResponse<AlertConfig>> SetEnabled(string key, bool enabled);

        /// <summary>
        /// Sets the lead time (in days) for the alert identified by the given Key. Only meaningful
        /// for alerts that warn ahead of a date; ignored by alerts that only flag overdue items.
        /// </summary>
        Task<WebApiResponse<AlertConfig>> SetThresholdDays(string key, int thresholdDays);

        /// <summary>
        /// Cheap check used by the services that run each alert. Fails open (true) when the
        /// config isn't registered yet, so a missing seed never silently disables an alert.
        /// </summary>
        Task<bool> IsEnabledAsync(string key);

        /// <summary>
        /// Returns the configured lead time (in days) for the given alert, or
        /// <paramref name="defaultValue"/> when no override is configured.
        /// </summary>
        Task<int> GetThresholdDaysAsync(string key, int defaultValue);
    }
}
