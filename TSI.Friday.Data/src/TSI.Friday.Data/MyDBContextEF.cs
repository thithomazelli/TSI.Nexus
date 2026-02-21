using System;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Data
{
    public class MyDBContextEF : IdentityDbContext<User>
    {
        /// <summary>
        /// MyDBContextEF constructor created to initialize the DbContext based on DbContextOptions object received as parameter.
        /// </summary>
        /// <param name="options"></param>
        public MyDBContextEF(DbContextOptions<MyDBContextEF> options)
            : base(options)
        {
            // Do not create DB triggers here. Use SaveChangesInterceptor to maintain related aggregates in application layer.
        }

        #region DbSets

        public DbSet<Address> Address { get; set; }

        public DbSet<BusinessPartner> BusinessPartner { get; set; }

        public DbSet<User> User { get; set; }

        public DbSet<Order> Order { get; set; }

        public DbSet<OrderProduct> OrderProduct { get; set; }

        public DbSet<Payment> Payment { get; set; }

        public DbSet<PaymentInstallment> PaymentInstallment { get; set; }

        public DbSet<Product> Product { get; set; }

        public DbSet<ProductPhoto> ProductPhoto { get; set; }

        public DbSet<Sequence> Sequence { get; set; }

        #endregion DbSets

        /// <summary>
        /// Method responsible to create the entire model based on the preset settings
        /// </summary>
        /// <param name="modelBuilder"></param>
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder
                .Entity<BusinessPartner>()
                .HasDiscriminator(c => c.DocumentType)
                .HasValue<Individual>("Física")
                .HasValue<Company>("Jurídica");

            modelBuilder
                .Entity<BusinessPartner>()
                .Property("DocumentType")
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            modelBuilder.Entity<Order>().HasIndex(o => o.OrderNumber).IsUnique();

            // Configure Sequence entity explicitly to keep model consistent with migrations
            modelBuilder.Entity<Sequence>(b =>
            {
                b.HasKey(s => s.Name);
                b.Property(s => s.Name)
                    .HasMaxLength(100)
                    .IsRequired()
                    .HasColumnType("varchar(100)");
                b.Property(s => s.NextVal).IsRequired().HasColumnType("bigint");
                b.ToTable("Sequence");
            });

            modelBuilder
                .Entity<Order>()
                .Property(op => op.TotalPrice)
                .HasComputedColumnSql("(Price - (Price * Discount / 100.0))", stored: true);

            modelBuilder
                .Entity<OrderProduct>()
                .Property(op => op.TotalPrice)
                .HasComputedColumnSql(
                    "((Price * Quantity) - ((Price * Quantity) * Discount / 100.0))",
                    stored: true
                );

            base.OnModelCreating(modelBuilder);
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);

            // Store all enums as strings globally
            configurationBuilder.Properties<Enum>().HaveConversion<string>();
        }
    }
}
