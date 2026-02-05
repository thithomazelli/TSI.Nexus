using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IRepository<T>
        where T : class
    {
        /// <summary>
        /// This function will be receive an object as parameter and should be add it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be added.</param>
        Task AddAsync(T entity);

        /// <summary>
        /// This function will be receive an object as parameter and should be update it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be updated.</param>
        Task UpdateAsync(T entity);

        /// <summary>
        /// This function will be receive a rango of object as parameter and should be update them into the database.
        /// </summary>
        /// <param name="entity">A list of entity objects to be updated.</param>
        Task UpdateRangeAsync(IEnumerable<T> entities);

        /// <summary>
        /// This function will be receive an object as parameter and should be remove it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be removed.</param>
        Task RemoveAsync(T entity);

        /// <summary>
        /// This function will be not receive parameter and should be returns all registers found in this entity.
        /// </summary>
        /// <returns>Returns all registers found in this entity.</returns>
        Task<IList<T>> GetAllAsync();

        /// <summary>
        /// This function will be not receive parameter and should be returns all registers found in this entity.
        /// </summary>
        /// <param name="includes">The objects to be included in the search.</param>
        /// <returns>Returns all registers found in this entity.</returns>
        Task<IList<T>> GetAllAsync(params Expression<Func<T, object>>[] includes);

        /// <summary>
        /// This function will be receive the "ID" as parameter and should be returns the object found.
        /// </summary>
        /// <param name="id">The ID value to be used on the search.</param>
        /// <returns>Returns the object found</returns>
        Task<T> GetByIdAsync(object id);

        /// <summary>
        /// This function will be receive the "ID" as parameter and should be returns the object found.
        /// </summary>
        /// <param name="id">The ID value to be used on the search.</param>
        /// <param name="includes">The objects to be included in the search.</param>
        /// <returns></returns>
        Task<T> GetByIdAsync(object id, params Expression<Func<T, object>>[] includes);

        /// <summary>
        /// This function will be receive the "Name" as parameter and should be returns the object found.
        /// </summary>
        /// <param name="name">The Name value to be used on the search.</param>
        /// <returns>Returns the object found</returns>
        Task<T> GetByNameAsync(string name);

        /// <summary>
        /// This function will be receive an expression as parameter and should be returns true if any object found.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <returns>Returns true if any object found matching the filter.</returns>
        Task<bool> AnyAsync(Expression<Func<T, bool>> filter);

        /// <summary>
        /// This function will be receive an expression as parameter and should be returns the first object found.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <returns>Returns the first object found matching the filter.</returns>
        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> filter);

        /// <summary>
        /// This function will be receive an expression as parameter and should be returns the first object found.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <param name="includes">The objects to be included in the search.</param>
        /// <returns>Returns the first object found matching the filter.</returns>
        Task<T> FirstOrDefaultAsync(
            Expression<Func<T, bool>> filter,
            params Expression<Func<T, object>>[] includes
        );

        /// <summary>
        /// This function will be receive na expression as parameter and should be returns results from the execute.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <returns>Returns a list with the objects found on the execution.</returns>
        Task<IList<T>> QueryAsync(Expression<Func<T, bool>> filter);

        /// <summary>
        /// This function will be receive na expression as parameter and should be returns results from the execute.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <param name="includes">The objects to be included in the search.</param>
        /// <returns>Returns a list with the objects found on the execution.</returns>
        Task<IList<T>> QueryAsync(
            Expression<Func<T, bool>> filter,
            params Expression<Func<T, object>>[] includes
        );
    }
}
