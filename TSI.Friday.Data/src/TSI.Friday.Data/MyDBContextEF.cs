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

        public DbSet<TripLeg> TripLeg { get; set; }

        public DbSet<Passenger> Passenger { get; set; }

        public DbSet<FuelLog> FuelLog { get; set; }

        public DbSet<ServiceOrder> ServiceOrder { get; set; }

        public DbSet<Commission> Commission { get; set; }

        public DbSet<Trip> Trip { get; set; }

        public DbSet<QuoteTrip> QuoteTrip { get; set; }

        public DbSet<DocumentTemplate> DocumentTemplate { get; set; }

        public DbSet<FeatureToggle> FeatureToggle { get; set; }

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
                .Entity<Payment>()
                .HasOne(pi => pi.Trip)
                .WithMany(t => t.Payments)
                .HasForeignKey(pi => pi.TripId)
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
                .HasOne(a => a.Trip)
                .WithMany(t => (ICollection<Attachment>)t.Attachments)
                .HasForeignKey(a => a.TripId)
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

            modelBuilder
                .Entity<VehicleMaintenance>()
                .HasOne(m => m.Product)
                .WithMany()
                .HasForeignKey(m => m.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Driver>().HasIndex(d => d.SocialSecurityCard).IsUnique();

            modelBuilder
                .Entity<FuelLog>()
                .HasOne(f => f.Vehicle)
                .WithMany(v => v.FuelLogs)
                .HasForeignKey(f => f.VehicleId)
                .OnDelete(DeleteBehavior.Cascade);

            // Trip - an independent root entity (its own client/price/transaction), not an
            // extension of Order. Kept fully decoupled so clients that don't use the fleet module
            // never carry any trace of it on Order/Quote.
            modelBuilder.Entity<Trip>().HasIndex(t => t.TripNumber).IsUnique();

            modelBuilder
                .Entity<Trip>()
                .Property(t => t.TotalPrice)
                .HasComputedColumnSql("(Price - (Price * Discount /100.0))", stored: true);

            modelBuilder
                .Entity<Trip>()
                .HasOne(t => t.Transaction)
                .WithOne(p => p.Trip)
                .HasForeignKey<Trip>(t => t.TransactionId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Trip>()
                .HasOne(t => t.Vehicle)
                .WithMany(v => v.Trips)
                .HasForeignKey(t => t.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Trip>()
                .HasOne(t => t.Driver)
                .WithMany(d => d.Trips)
                .HasForeignKey(t => t.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            // 1 QuoteTrip per Quote (the trip-specific data of a Type == Trip quote).
            modelBuilder.Entity<QuoteTrip>().HasIndex(qt => qt.QuoteId).IsUnique();

            modelBuilder
                .Entity<QuoteTrip>()
                .HasOne(qt => qt.Quote)
                .WithMany()
                .HasForeignKey(qt => qt.QuoteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<QuoteTrip>()
                .HasOne(qt => qt.Vehicle)
                .WithMany()
                .HasForeignKey(qt => qt.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<QuoteTrip>()
                .HasOne(qt => qt.Driver)
                .WithMany()
                .HasForeignKey(qt => qt.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<TripLeg>()
                .HasOne(t => t.Trip)
                .WithMany(tr => tr.TripLegs)
                .HasForeignKey(t => t.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Passenger>()
                .HasOne(p => p.Trip)
                .WithMany(tr => tr.Passengers)
                .HasForeignKey(p => p.TripId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ServiceOrder>().HasIndex(s => s.Number).IsUnique();

            modelBuilder
                .Entity<ServiceOrder>()
                .HasOne(s => s.Trip)
                .WithMany()
                .HasForeignKey(s => s.TripId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<ServiceOrder>()
                .HasOne(s => s.Driver)
                .WithMany(d => d.ServiceOrders)
                .HasForeignKey(s => s.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<ServiceOrder>()
                .HasOne(s => s.Vehicle)
                .WithMany()
                .HasForeignKey(s => s.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder
                .Entity<Commission>()
                .HasOne(c => c.ServiceOrder)
                .WithOne(s => s.Commission)
                .HasForeignKey<Commission>(c => c.ServiceOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<Commission>()
                .HasOne(c => c.Driver)
                .WithMany()
                .HasForeignKey(c => c.DriverId)
                .OnDelete(DeleteBehavior.Restrict);

            // One DocumentTemplate row per DocumentTemplateType - it's "the current template for
            // each document", not a list of arbitrary files.
            modelBuilder.Entity<DocumentTemplate>().HasIndex(dt => dt.Type).IsUnique();

            // One FeatureToggle row per Key - see FeatureToggleKeys for the known values.
            modelBuilder.Entity<FeatureToggle>().HasIndex(f => f.Key).IsUnique();

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
