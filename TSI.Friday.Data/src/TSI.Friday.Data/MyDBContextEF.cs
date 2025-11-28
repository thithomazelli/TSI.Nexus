using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data
{
    public class MyDBContextEF : IdentityDbContext<User>
    {
        /// <summary>
        /// MyDBContextEF constructor created to initialize the DbContext based on DbContextOptions object received as parameter.
        /// </summary>
        /// <param name="options"></param>
        public MyDBContextEF(DbContextOptions<MyDBContextEF> options) : base(options) { }

        #region DbSets

        public DbSet<User> User { get; set; }
        //public DbSet<Person> Person { get; set; }
        //public DbSet<Individual> Individual { get; set; }
        //public DbSet<Company> Company { get; set; }
        //public DbSet<Address> Address { get; set; }
        public DbSet<Product> Product { get; set; }

        #endregion DbSets

        /// <summary>
        /// Method responsible to create the entire model based on the preset settings
        /// </summary>
        /// <param name="modelBuilder"></param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            //modelBuilder.Ignore<Person>();
            //modelBuilder.Entity<Individual>().ToTable("Individual");
            //modelBuilder.Entity<Company>().ToTable("Company");
            //modelBuilder.Entity<Person>()
            //    .HasDiscriminator<string>("PersonType")
            //    .HasValue<Individual>("Individual")
            //    .HasValue<Company>("Company");

            base.OnModelCreating(modelBuilder);
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);

            // Store all enums as strings globally
            configurationBuilder
                .Properties<Enum>()
                .HaveConversion<string>();
        }
    }
}
