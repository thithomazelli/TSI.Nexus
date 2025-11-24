using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace TSI.Friday.Contracts.Interfaces
{
    public interface IRepository<T> where T : class
    {
        /// <summary>
        /// This function will be receive an object as parameter and should be add it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be added.</param>
        void Add(T entity);

        /// <summary>
        /// This function will be receive an object as parameter and should be update it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be updated.</param>
        void Update(T entity);

        /// <summary>
        /// This function will be receive an object as parameter and should be remove it to the database.
        /// </summary>
        /// <param name="entity">The entity object to be removed.</param>
        void Remove(T entity);

        /// <summary>
        /// This function will be not receive parameter and should be returns all registers found in this entity.
        /// </summary>
        /// <returns>Returns all registers found in this entity.</returns>
        IList<T> GetAll();

        /// <summary>
        /// This function will be receive the "ID" as parameter and should be returns the object found.
        /// </summary>
        /// <param name="id">The ID value to be used on the search.</param>
        /// <returns>Returns the object found</returns>
        T GetById(int? id);

        /// <summary>
        /// This function will be receive the "Name" as parameter and should be returns the object found.
        /// </summary>
        /// <param name="name">The Name value to be used on the search.</param>
        /// <returns>Returns the object found</returns>
        T GetByName(string name);

        /// <summary>
        /// This function will be receive na expression as parameter and should be returns results from the execute.
        /// </summary>
        /// <param name="filter">The filter expression to be used on the search.</param>
        /// <returns>Returns a list with the objects found on the execution.</returns>
        IList<T> Query(Expression<Func<T, bool>> filter);
    }
}
