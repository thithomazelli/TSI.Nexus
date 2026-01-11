using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System;
using TSI.Friday.Contracts.Enums;
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
        public DbSet<Client> Client { get; set; }
        public DbSet<Address> Address { get; set; }
        public DbSet<Product> Product { get; set; }
        public DbSet<ProductPhoto> ProductPhoto { get; set; }

        #endregion DbSets

        /// <summary>
        /// Method responsible to create the entire model based on the preset settings
        /// </summary>
        /// <param name="modelBuilder"></param>
        /// 
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Client>()
                .HasDiscriminator(c => c.Type)
                    .HasValue<Individual>("Física")
                    .HasValue<Company>("Jurídica");

            modelBuilder.Entity<Client>()
                .Property("Type")
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

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
