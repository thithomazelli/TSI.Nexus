using System;
using System.Collections.Generic;
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

        public DbSet<Attachment> Attachment { get; set; }

        public DbSet<Address> Address { get; set; }

        public DbSet<BusinessPartner> BusinessPartner { get; set; }

        public DbSet<User> User { get; set; }

        public DbSet<Order> Order { get; set; }

        public DbSet<OrderProduct> OrderProduct { get; set; }

        public DbSet<Transaction> Transaction { get; set; }

        public DbSet<Payment> Payment { get; set; }

        public DbSet<Product> Product { get; set; }

        public DbSet<ProductPhoto> ProductPhoto { get; set; }

        public DbSet<Quote> Quote { get; set; }

        public DbSet<QuoteProduct> QuoteProduct { get; set; }

        public DbSet<Sequence> Sequence { get; set; }

        public DbSet<Attachment> Attachments { get; set; }

        public DbSet<Vehicle> Vehicle { get; set; }

        public DbSet<VehicleMaintenance> VehicleMaintenance { get; set; }

        public DbSet<Driver> Driver { get; set; }

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
                .HasComputedColumnSql("(Price - (Price * Discount /100.0))", stored: true);

            modelBuilder
                .Entity<OrderProduct>()
                .Property(op => op.TotalPrice)
                .HasComputedColumnSql(
                    "((Price * Quantity) - ((Price * Quantity) * Discount /100.0))",
                    stored: true
                );

            // Quote entity uses QuoteNumber property
            modelBuilder.Entity<Quote>().HasIndex(q => q.QuoteNumber).IsUnique();

            modelBuilder
                .Entity<Quote>()
                .Property(q => q.TotalPrice)
                .HasComputedColumnSql("(Price - (Price * Discount /100.0))", stored: true);

            modelBuilder
                .Entity<QuoteProduct>()
                .Property(qp => qp.TotalPrice)
                .HasComputedColumnSql(
                    "((Price * Quantity) - ((Price * Quantity) * Discount / 100.0))",
                    stored: true
                );

            AddIndexByCreateDateForDataTables(modelBuilder);

            modelBuilder
                .Entity<Order>()
                .HasOne(o => o.Transaction)
                .WithOne(p => p.Order)
                .HasForeignKey<Order>(o => o.TransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Transaction>()
                .HasMany(p => p.Payments)
                .WithOne(i => i.Transaction)
                .HasForeignKey(i => i.TransactionId)
                .IsRequired()
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Payment>()
                .HasOne(pi => pi.Order)
                .WithMany(o => o.Payments)
                .HasForeignKey(pi => pi.OrderId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.BusinessPartner)
                .WithMany(b => (ICollection<Attachment>)b.Attachments)
                .HasForeignKey(a => a.BusinessPartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.Order)
                .WithMany(o => (ICollection<Attachment>)o.Attachments)
                .HasForeignKey(a => a.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.Transaction)
                .WithMany(t => (ICollection<Attachment>)t.Attachments)
                .HasForeignKey(a => a.TransactionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.Payment)
                .WithMany(p => (ICollection<Attachment>)p.Attachments)
                .HasForeignKey(a => a.PaymentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.Product)
                .WithMany(p => (ICollection<Attachment>)p.Attachments)
                .HasForeignKey(a => a.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Attachment>()
                .HasOne(a => a.User)
                .WithMany(u => (ICollection<Attachment>)u.Attachments)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Vehicle>().HasIndex(v => v.Plate).IsUnique();

            modelBuilder
                .Entity<VehicleMaintenance>()
                .HasOne(m => m.Vehicle)
                .WithMany(v => v.Maintenances)
                .HasForeignKey(m => m.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Driver>().HasIndex(d => d.SocialSecurityCard).IsUnique();

            modelBuilder
                .Entity<Order>()
                .HasOne(o => o.Vehicle)
                .WithMany(v => v.Orders)
                .HasForeignKey(o => o.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Order>()
                .HasOne(o => o.Driver)
                .WithMany(d => d.Orders)
                .HasForeignKey(o => o.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }

        protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
        {
            base.ConfigureConventions(configurationBuilder);

            // Store all enums as strings globally
            configurationBuilder.Properties<Enum>().HaveConversion<string>();
        }

        private void AddIndexByCreateDateForDataTables(ModelBuilder modelBuilder)
        {
            // Create index on CreateDate for all entities that have this property (inherited from BaseModel)
            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                // Check if the CLR type has a property named CreateDate
                var clrType = entityType.ClrType;
                if (clrType == null)
                {
                    continue;
                }

                var prop = clrType.GetProperty("CreateDate");
                if (prop != null)
                {
                    // Ensure the entity is part of the model and define an index on the shadow/property
                    modelBuilder.Entity(clrType).HasIndex("CreateDate");
                }
            }
        }
    }
}
