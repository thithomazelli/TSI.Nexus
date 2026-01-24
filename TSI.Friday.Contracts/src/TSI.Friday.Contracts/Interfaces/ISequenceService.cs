using System.Threading.Tasks;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface ISequenceService
    {
        /// <summary>
        /// Obtains the next value of the specified sequence atomically.
        /// Increments the stored value and returns the new value.
        /// </summary>
        /// <param name="sequenceName">Logical name of the sequence.</param>
        /// <returns>The next sequence value as a long.</returns>
        Task<long> GetNextValue(string sequenceName);
    }
}
