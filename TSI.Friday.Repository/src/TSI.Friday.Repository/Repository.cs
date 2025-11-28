using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;
using TSI.Friday.Contracts.Interfaces;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data;

namespace TSI.Friday.Repository
{
    public class Repository<T> : IRepository<T> where T : class
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
        public void Add(T entity) 
        {
            if (entity is BaseModel baseModel)
            {
                baseModel.CreateUserId = 0;
                baseModel.ModifyUserId = 0;
            }

            _myDbContext.Set<T>().Add(entity);
            SaveChanges();
        }

        /// <inheritdoc />
        public void Update(T entity)
        {
            if (entity is BaseModel baseModel)
            {
                baseModel.ModifyUserId = 0;
                baseModel.ModifyDate = DateTime.Now;
            }

            _myDbContext.Entry(entity).State = EntityState.Modified;
            SaveChanges();
        }

        /// <inheritdoc />
        public void Remove(T entity)
        {
            _myDbContext.Set<T>().Remove(entity);
            SaveChanges();
        }

        /// <inheritdoc />
        public T GetById(int? id)
        {
            var entity = _myDbContext.Set<T>().Find(id);

            return entity == null
                ? throw new KeyNotFoundException($"Entity '{id}' not found.")
                : entity;
        }

        /// <inheritdoc />
        public T GetByName(string name)
        {
            var entity = _myDbContext.Set<T>().Find(name);

            return entity == null
                ? throw new KeyNotFoundException($"Entity '{name}' not found.")
                : entity;
        }

        /// <inheritdoc />
        public IList<T> Query(Expression<Func<T, bool>> filter)
        {
            return _myDbContext.Set<T>().Where(filter).ToList();
        }

        /// <inheritdoc />
        public IList<T> GetAll()
        {
            return _myDbContext.Set<T>().ToList();
        }

        #endregion Public methods

        #region Private methods

        /// <summary>
        /// This function should be commit the changes on the database.
        /// </summary>
        private void SaveChanges()
        {
            _myDbContext.SaveChanges();
        }

        #endregion Private methods
    }
}
