using TSI.Nexus.Contracts.Interfaces;
using TSI.Nexus.Contracts.Models;

namespace TSI.Nexus.Services
{
    public class SequenceService : ISequenceService
    {
        #region Properties

        /// <summary>
        /// Repository object created to access the Sequence registers on database using EntityFramework.
        /// </summary>
        private readonly IRepository<Sequence> _sequenceRepository;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// Initializes a new instance of the <see cref="SequenceService"/> class.
        /// </summary>
        /// <param name="sequenceRepository">Repository used to access and modify sequence records.</param>
        public SequenceService(IRepository<Sequence> sequenceRepository)
        {
            _sequenceRepository = sequenceRepository;
        }

        /// <summary>
        /// Obtains the next value of the specified sequence atomically (best-effort with repository).
        /// Ensures the sequence row exists, returns the current value and increments the stored NextVal.
        /// </summary>
        /// <param name="sequenceName">Logical name of the sequence.</param>
        /// <returns>The next sequence value as a long.</returns>
        public async Task<long> GetNextValue(string sequenceName)
        {
            var (seq, created, current) = await EnsureExistsAndGetCurrent(sequenceName);

            if (created)
            {
                // Already seeded with NextVal = current +1 when created, no update required.
                return current;
            }

            // Update to next and persist
            seq.NextVal = current +1;
            await _sequenceRepository.UpdateAsync(seq);

            return current;
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// Ensures a sequence with the specified name exists in the sequence table.
        /// If it does not exist, creates an initial entry with NextVal =2 and returns (seq, true,1).
        /// If it exists, returns (seq, false, currentNextVal).
        /// </summary>
        /// <param name="sequenceName">Logical name of the sequence (e.g. "OrderNumberSeq").</param>
        private async Task<(Sequence seq, bool created, long current)> EnsureExistsAndGetCurrent(string sequenceName)
        {
            var list = await _sequenceRepository.QueryAsync(s => s.Name == sequenceName);
            var seq = list.FirstOrDefault();
            if (seq == null)
            {
                // create seeded entry where NextVal is the next to use after returning1
                var newSeq = new Sequence { Name = sequenceName, NextVal =2 };
                await _sequenceRepository.AddAsync(newSeq);
                return (newSeq, true,1L);
            }

            var current = seq.NextVal;

            if (current <= 0)
            {
                current = 1;
            }

            return (seq, false, current);
        }

        #endregion Private methods
    }
}
