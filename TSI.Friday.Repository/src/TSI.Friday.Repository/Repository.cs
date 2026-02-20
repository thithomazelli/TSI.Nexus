using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Data;

namespace TSI.Friday.Repository
{
    public class Repository<T> : IRepository<T>
        where T : class
    {
        #region Properties

        /// <summary>
        /// MyDBContextEF object responsible to stablish the connection with database using EntityFramework
        /// </summary>
        protected readonly MyDBContextEF _myDbContext;

        #endregion Properties

        #region Public methods

        /// <summary>
        /// Repository constructor create to initialize the "_myDbContext" using Dependency Injection.
        /// </summary>
        /// <param name="context">MyDBContextEF object used to initialize the internal variable using Dependency Injection.</param>
        public Repository(MyDBContextEF context)
        {
            _myDbContext = context;
        }

        /// <inheritdoc />
        public async Task AddAsync(T entity)
        {
            await _myDbContext.Set<T>().AddAsync(entity);
            await SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task UpdateAsync(T entity)
        {
            _myDbContext.Entry(entity).State = EntityState.Modified;
            await SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task UpdateRangeAsync(IEnumerable<T> entities)
        {
            _myDbContext.UpdateRange(entities);
            await SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task RemoveAsync(T entity)
        {
            _myDbContext.Set<T>().Remove(entity);
            await SaveChangesAsync();
        }

        /// <inheritdoc />
        public async Task<T> GetByIdAsync(object id)
        {
            var entity = await _myDbContext.Set<T>().FindAsync(id);

            return entity == null
                ? throw new KeyNotFoundException($"Entity '{id}' not found.")
                : entity;
        }

        /// <inheritdoc />
        public async Task<T> GetByIdAsync(object id, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _myDbContext.Set<T>().AsQueryable();

            if (includes != null)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            var entity = await query.SingleOrDefaultAsync(e =>
                EF.Property<object>(e, "Id").Equals(id)
            );

            return entity ?? throw new KeyNotFoundException($"Entity '{id}' not found.");
        }

        /// <inheritdoc />
        public async Task<T> GetByNameAsync(string name)
        {
            var entity = await _myDbContext.Set<T>().FindAsync(name);
            return entity == null
                ? throw new KeyNotFoundException($"Entity '{name}' not found.")
                : entity;
        }

        /// <inheritdoc />
        public async Task<bool> AnyAsync(Expression<Func<T, bool>> filter)
        {
            return await _myDbContext.Set<T>().AnyAsync(filter);
        }

        /// <inheritdoc />
        public async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> filter)
        {
            return await _myDbContext.Set<T>().FirstOrDefaultAsync(filter)
                ?? throw new InvalidOperationException("No entity found matching the filter.");
        }

        /// <inheritdoc />
        public async Task<T> FirstOrDefaultAsync(
            Expression<Func<T, bool>> filter,
            params Expression<Func<T, object>>[] includes
        )
        {
            IQueryable<T> query = _myDbContext.Set<T>().Where(filter);

            if (includes != null && includes.Length > 0)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            var entity = await query.FirstOrDefaultAsync();

            return entity
                ?? throw new InvalidOperationException("No entity found matching the filter.");
        }

        /// <inheritdoc />
        public async Task<IList<T>> QueryAsync(Expression<Func<T, bool>> filter)
        {
            return await _myDbContext.Set<T>().Where(filter).ToListAsync();
        }

        /// <inheritdoc />
        public async Task<IList<T>> QueryAsync(
            Expression<Func<T, bool>> filter,
            params Expression<Func<T, object>>[] includes
        )
        {
            IQueryable<T> query = _myDbContext.Set<T>().Where(filter);

            if (includes != null && includes.Length > 0)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            var list = await query.ToListAsync();

            return list ?? new List<T>();
        }

        /// <inheritdoc />
        public async Task<IList<T>> GetAllAsync()
        {
            return await _myDbContext.Set<T>().ToListAsync();
        }

        /// <inheritdoc />
        public async Task<IList<T>> GetAllAsync(params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = _myDbContext.Set<T>().AsQueryable();

            if (includes != null && includes.Length > 0)
            {
                foreach (var include in includes)
                {
                    query = query.Include(include);
                }
            }

            return await query.ToListAsync();
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// This function should be commit the changes on the database.
        /// </summary>
        private async Task SaveChangesAsync()
        {
            await _myDbContext.SaveChangesAsync();
        }

        #endregion Private methods
    }
}
