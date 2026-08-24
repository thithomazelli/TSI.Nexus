using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Data;

namespace TSI.Nexus.Data.Seed
{
    /// <summary>
    /// Populates a clean database with realistic-looking demo data (fake business partners,
    /// products, quotes, orders, fleet, trips, etc.) so the application can be presented without
    /// manually creating records first. Only ever runs when explicitly enabled (see Program.cs)
    /// and only when the database is still empty - it never touches a database that already has
    /// real BusinessPartner records, seeded or not.
    /// </summary>
    public static class DemoDataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            using var scope = services.CreateScope();
            var provider = scope.ServiceProvider;
            var logger = provider.GetService<ILoggerFactory>()?.CreateLogger("DemoDataSeeder");

            try
            {
                var context = provider.GetRequiredService<MyDBContextEF>();

                if (await context.BusinessPartner.AnyAsync())
                {
                    logger?.LogInformation(
                        "DemoDataSeeder: BusinessPartner table is not empty, skipping demo data seed."
                    );
                    return;
                }

                var faker = new Faker("pt_BR");
                var now = DateTime.UtcNow;

                logger?.LogInformation("DemoDataSeeder: seeding demo data...");

                // ---- Phase 1: BusinessPartners ----
                var businessPartners = BuildBusinessPartners(faker);
                await context.BusinessPartner.AddRangeAsync(businessPartners);
                await context.SaveChangesAsync();

                // ---- Phase 2: Addresses ----
                var addresses = BuildAddresses(faker, businessPartners);
                await context.Address.AddRangeAsync(addresses);
                await context.SaveChangesAsync();

                // ---- Phase 3: Products, Drivers, Vehicles ----
                var products = BuildProducts();
                await context.Product.AddRangeAsync(products);

                var drivers = BuildDrivers(faker, now);
                await context.Driver.AddRangeAsync(drivers);

                var vehicles = BuildVehicles(faker);
                await context.Vehicle.AddRangeAsync(vehicles);

                await context.SaveChangesAsync();

                var clientProducts = products
                    .Where(p => p.Category != "Peças" && p.Category != "Combustível")
                    .ToList();
                var partProducts = products.Where(p => p.Category == "Peças").ToList();
                var fuelProducts = products.Where(p => p.Category == "Combustível").ToList();
                var clients = businessPartners.Where(bp => bp.Type == BusinessPartnerType.Client).ToList();

                // ---- Phase 4: Quotes + QuoteProducts ----
                var quotes = BuildQuotes(faker, clients, now, out var quoteProducts, clientProducts);
                await context.Quote.AddRangeAsync(quotes);
                await context.QuoteProduct.AddRangeAsync(quoteProducts);
                await context.SaveChangesAsync();

                // ---- Phase 5: Orders + Transactions (generic, no fleet fields - Order stays
                // exactly as it is without the fleet module) ----
                var convertedQuotes = quotes.Where(q => q.Status == QuoteStatus.Converted).ToList();
                var orders = BuildOrders(faker, clients, convertedQuotes, now, out var orderTransactions);
                await context.Transaction.AddRangeAsync(orderTransactions);
                await context.Order.AddRangeAsync(orders);
                await context.SaveChangesAsync();

                // ---- Phase 5b: Trips + Transactions (independent root entity - see
                // docs/feature-toggle-design.md) ----
                var trips = BuildTrips(faker, clients, drivers, vehicles, now, out var tripTransactions);
                await context.Transaction.AddRangeAsync(tripTransactions);
                await context.Trip.AddRangeAsync(trips);
                await context.SaveChangesAsync();

                // ---- Phase 6: OrderProducts (stock is adjusted for Sale/Rental products here) ----
                var orderProducts = BuildOrderProducts(faker, orders, clientProducts);
                await context.OrderProduct.AddRangeAsync(orderProducts);
                await context.SaveChangesAsync();

                // ---- Phase 7: Payments (Orders and Trips each have their own) ----
                var payments = BuildPayments(faker, orders, now);
                await context.Payment.AddRangeAsync(payments);

                var tripPayments = BuildTripPayments(faker, trips, now);
                await context.Payment.AddRangeAsync(tripPayments);

                await context.SaveChangesAsync();

                // ---- Phase 7b: Expenses ("Despesas" = Payment.Type Outgoing, its own standalone
                // Transaction against a Supplier - see BuildExpenses) ----
                var suppliers = businessPartners
                    .Where(bp => bp.Type == BusinessPartnerType.Supplier)
                    .ToList();
                var expenses = BuildExpenses(faker, suppliers, now, out var expenseTransactions);
                await context.Transaction.AddRangeAsync(expenseTransactions);
                await context.Payment.AddRangeAsync(expenses);
                await context.SaveChangesAsync();

                // ---- Phase 7b2: PurchaseOrders + PurchaseOrderProducts + Payments (stock is
                // NOT incremented here - PurchaseOrderStockIncrementingSaveChangesInterceptor only
                // fires on a Status transition into Closed, not on a fresh insert already sitting
                // at Closed) ----
                var purchaseOrders = BuildPurchaseOrders(faker, suppliers, now, out var purchaseOrderTransactions);
                await context.Transaction.AddRangeAsync(purchaseOrderTransactions);
                await context.PurchaseOrder.AddRangeAsync(purchaseOrders);
                await context.SaveChangesAsync();

                var purchaseOrderProducts = BuildPurchaseOrderProducts(faker, purchaseOrders, products);
                await context.PurchaseOrderProduct.AddRangeAsync(purchaseOrderProducts);
                await context.SaveChangesAsync();

                var purchaseOrderPayments = BuildPurchaseOrderPayments(faker, purchaseOrders, now);
                await context.Payment.AddRangeAsync(purchaseOrderPayments);
                await context.SaveChangesAsync();

                // ---- Phase 7c: TripDrivers (a Trip can have any number of drivers now - each
                // one's Amount becomes its own Outgoing Payment/expense on the Trip's own
                // Transaction, see BuildTripDrivers) ----
                var tripDrivers = BuildTripDrivers(faker, trips, drivers, now, out var tripDriverPayments);
                await context.Payment.AddRangeAsync(tripDriverPayments);
                await context.TripDriver.AddRangeAsync(tripDrivers);
                await context.SaveChangesAsync();

                // ---- Phase 8: TripLegs + Passengers ----
                var tripLegs = BuildTripLegs(faker, trips);
                await context.TripLeg.AddRangeAsync(tripLegs);

                var passengers = BuildPassengers(faker, trips);
                await context.Passenger.AddRangeAsync(passengers);

                await context.SaveChangesAsync();

                // ---- Phase 9: FuelLogs ----
                var fuelLogs = BuildFuelLogs(faker, vehicles, fuelProducts, now);
                await context.FuelLog.AddRangeAsync(fuelLogs);
                await context.SaveChangesAsync();

                // ---- Phase 10: VehicleMaintenances (part consumption adjusts stock here) ----
                var maintenances = BuildVehicleMaintenances(faker, vehicles, partProducts, now, out var maintenanceProducts);
                await context.VehicleMaintenance.AddRangeAsync(maintenances);
                await context.SaveChangesAsync();

                await context.VehicleMaintenanceProduct.AddRangeAsync(maintenanceProducts);
                await context.SaveChangesAsync();

                // ---- Phase 11: ServiceOrders (one per Trip that has a Driver) ----
                var serviceOrders = BuildServiceOrders(trips, now);
                await context.ServiceOrder.AddRangeAsync(serviceOrders);
                await context.SaveChangesAsync();

                // ---- Phase 12: Commissions (one per completed ServiceOrder) ----
                var commissions = BuildCommissions(faker, serviceOrders, drivers, now);
                await context.Commission.AddRangeAsync(commissions);
                await context.SaveChangesAsync();

                // ---- Phase 12b: Events (Agenda) - at least one per linkable entity type, so
                // every entity's own "Agenda" tab has something to show out of the box. EventType
                // options and the always-present system users come from SelectableOptionSeeder/
                // DatabaseSeeder, both of which run before DemoDataSeeder (see Program.cs). ----
                var eventTypeOptions = await context
                    .SelectableOption.Where(o => o.Group == SelectableOptionGroup.EventType)
                    .ToListAsync();
                var systemUsers = await context
                    .User.Where(u =>
                        u.UserName == "admin"
                        || u.UserName == "thiago.thomazelli@gmail.com"
                        || u.UserName == "leonardothomazellif@gmail.com"
                    )
                    .ToListAsync();
                var adminUserId =
                    systemUsers.FirstOrDefault(u => u.UserName == "admin")?.Id ?? string.Empty;
                var allTransactions = orderTransactions
                    .Concat(tripTransactions)
                    .Concat(expenseTransactions)
                    .Concat(purchaseOrderTransactions)
                    .ToList();
                var allPayments = payments
                    .Concat(tripPayments)
                    .Concat(expenses)
                    .Concat(purchaseOrderPayments)
                    .Concat(tripDriverPayments)
                    .ToList();

                var events = BuildEvents(
                    faker,
                    now,
                    eventTypeOptions,
                    systemUsers,
                    adminUserId,
                    businessPartners,
                    quotes,
                    orders,
                    purchaseOrders,
                    trips,
                    allTransactions,
                    allPayments,
                    vehicles,
                    drivers,
                    maintenances,
                    fuelLogs,
                    out var eventParticipants
                );
                await context.Event.AddRangeAsync(events);
                await context.SaveChangesAsync();
                await context.EventParticipant.AddRangeAsync(eventParticipants);
                await context.SaveChangesAsync();

                // ---- Phase 13: Sequences - continue right after the numbers used above ----
                await EnsureSequenceAsync(context, "OrderNumberSeq", orders.Count + 1);
                await EnsureSequenceAsync(context, "PurchaseOrderNumberSeq", purchaseOrders.Count + 1);
                await EnsureSequenceAsync(context, "QuoteNumberSeq", quotes.Count + 1);
                await EnsureSequenceAsync(context, "TripNumberSeq", trips.Count + 1);
                await context.SaveChangesAsync();

                // ---- Phase 14: stamp CreateUserId/ModifyUserId with the admin account ----
                // AuditingSaveChangesInterceptor stamps these from ICurrentUserService.GetUserId()
                // on every SaveChangesAsync() call above, but that service reads the current HTTP
                // request's user - there is none while seeding at startup, so every row above got
                // an empty string instead. ExecuteUpdateAsync issues a direct SQL UPDATE (it never
                // goes through SaveChanges/the interceptor), so it can backfill them afterwards
                // without being immediately overwritten back to empty.
                await StampAuditFieldsWithAdminUserAsync(context, logger);

                logger?.LogInformation(
                    "DemoDataSeeder: seeded {BusinessPartners} business partners, {Products} products, "
                        + "{Drivers} drivers, {Vehicles} vehicles, {Quotes} quotes, {Orders} orders, "
                        + "{PurchaseOrders} purchase orders, "
                        + "{Trips} trips, {Payments} payments, {Expenses} expenses, {TripDrivers} trip drivers, "
                        + "{TripLegs} trip legs, "
                        + "{Passengers} passengers, {FuelLogs} fuel logs, {Maintenances} maintenances, "
                        + "{ServiceOrders} service orders, {Commissions} commissions, {Events} events, "
                        + "{EventParticipants} event participants.",
                    businessPartners.Count,
                    products.Count,
                    drivers.Count,
                    vehicles.Count,
                    quotes.Count,
                    orders.Count,
                    purchaseOrders.Count,
                    trips.Count,
                    payments.Count + tripPayments.Count + purchaseOrderPayments.Count,
                    expenses.Count,
                    tripDrivers.Count,
                    tripLegs.Count,
                    passengers.Count,
                    fuelLogs.Count,
                    maintenances.Count,
                    serviceOrders.Count,
                    commissions.Count,
                    events.Count,
                    eventParticipants.Count
                );
            }
            catch (Exception ex)
            {
                var logger2 = services.GetService<ILoggerFactory>()?.CreateLogger("DemoDataSeeder");
                logger2?.LogError(ex, "DemoDataSeeder: an error occurred while seeding demo data.");
            }
        }

        private static async Task StampAuditFieldsWithAdminUserAsync(
            MyDBContextEF context,
            ILogger logger
        )
        {
            var adminUserId = await context
                .User.Where(u => u.UserName == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync();

            if (string.IsNullOrEmpty(adminUserId))
            {
                logger?.LogWarning(
                    "DemoDataSeeder: 'admin' user not found, skipping CreateUserId/ModifyUserId backfill."
                );
                return;
            }

            await context
                .BusinessPartner.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Address.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Product.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Driver.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Vehicle.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Quote.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .QuoteProduct.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Order.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .OrderProduct.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Transaction.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Payment.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Trip.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .TripDriver.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .TripLeg.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Passenger.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .FuelLog.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .VehicleMaintenance.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .ServiceOrder.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Commission.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Event.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .EventParticipant.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
            await context
                .Sequence.Where(e => string.IsNullOrEmpty(e.CreateUserId))
                .ExecuteUpdateAsync(s =>
                    s.SetProperty(e => e.CreateUserId, adminUserId)
                        .SetProperty(e => e.ModifyUserId, adminUserId)
                );
        }

        #region BusinessPartner / Address

        private static List<BusinessPartner> BuildBusinessPartners(Faker faker)
        {
            var result = new List<BusinessPartner>();

            for (var i = 0; i < 15; i++)
            {
                var firstName = faker.Name.FirstName();
                var lastName = faker.Name.LastName();
                var isSupplier = i >= 13; // last 2 individuals are suppliers (freelance guides etc.)

                result.Add(
                    new Individual
                    {
                        Id = Guid.NewGuid(),
                        Name = $"{firstName} {lastName}",
                        Email = faker.Internet.Email(firstName, lastName),
                        Phone = faker.Phone.PhoneNumber("(##) ####-####"),
                        Mobile = faker.Phone.PhoneNumber("(##) 9####-####"),
                        Photo = string.Empty,
                        DocumentType = "Física",
                        Type = isSupplier ? BusinessPartnerType.Supplier : BusinessPartnerType.Client,
                        SocialSecurityCard = faker.Random.Replace("###.###.###-##"),
                        NationalIdCard = faker.Random.Replace("##.###.###-#"),
                        Birthday = faker.Date.Past(50, DateTime.UtcNow.AddYears(-18)),
                    }
                );
            }

            for (var i = 0; i < 10; i++)
            {
                var companyName = faker.Company.CompanyName();
                var isSupplier = i >= 7; // last 3 companies are suppliers (peças/oficina/combustível)

                result.Add(
                    new Company
                    {
                        Id = Guid.NewGuid(),
                        Name = companyName,
                        Email = faker.Internet.Email(companyName.Split(' ')[0], "contato"),
                        Phone = faker.Phone.PhoneNumber("(##) ####-####"),
                        Mobile = faker.Phone.PhoneNumber("(##) 9####-####"),
                        Photo = string.Empty,
                        DocumentType = "Jurídica",
                        Type = isSupplier ? BusinessPartnerType.Supplier : BusinessPartnerType.Client,
                        NationalRegistry = faker.Random.Replace("##.###.###/0001-##"),
                        StateRegistration = faker.Random.Replace("###.###.###.###"),
                        BusinessName = $"{companyName} LTDA",
                    }
                );
            }

            return result;
        }

        private static List<Address> BuildAddresses(Faker faker, List<BusinessPartner> businessPartners)
        {
            var result = new List<Address>();

            foreach (var bp in businessPartners)
            {
                result.Add(
                    new Address
                    {
                        Id = Guid.NewGuid(),
                        Name = "Principal",
                        Street = faker.Address.StreetName(),
                        Number = faker.Random.Number(10, 4500),
                        City = faker.Address.City(),
                        State = faker.Address.StateAbbr(),
                        ZipCode = faker.Random.Replace("#####-###"),
                        Country = "Brasil",
                        Comments = string.Empty,
                        Type = "Residencial",
                        IsDefault = true,
                        BusinessPartnerId = bp.Id,
                    }
                );
            }

            return result;
        }

        #endregion

        #region Product / Driver / Vehicle

        private static List<Product> BuildProducts()
        {
            // (Name, Category, Type, Price, StockOrCapacity)
            var catalog = new (string Name, string Category, ProductType Type, decimal Price, int Stock)[]
            {
                ("Fretamento Ônibus 46 Lugares - Diária", "Fretamento", ProductType.Rental, 2400m, 999),
                ("Fretamento Micro-ônibus 28 Lugares - Diária", "Fretamento", ProductType.Rental, 1600m, 999),
                ("Fretamento Van 15 Lugares - Diária", "Fretamento", ProductType.Rental, 950m, 999),
                ("Pacote Turístico - Litoral Norte SP (3 dias)", "Turismo", ProductType.Service, 780m, 999),
                ("Pacote Turístico - Serra da Mantiqueira (2 dias)", "Turismo", ProductType.Service, 620m, 999),
                ("Excursão Dia - Campos do Jordão", "Turismo", ProductType.Service, 190m, 999),
                ("Excursão Dia - Ilhabela", "Turismo", ProductType.Service, 210m, 999),
                ("City Tour - São Paulo", "Turismo", ProductType.Service, 120m, 999),
                ("Transfer Aeroporto - Guarulhos", "Transfer", ProductType.Service, 180m, 999),
                ("Transfer Rodoviário - Tietê", "Transfer", ProductType.Service, 90m, 999),
                ("Seguro Viagem Passageiro", "Seguro", ProductType.Service, 25m, 999),
                ("Motorista Extra - Diária", "Serviços", ProductType.Service, 350m, 999),
                ("Guia Turístico - Diária", "Serviços", ProductType.Service, 300m, 999),
                ("Locação de Ônibus com Motorista - Evento Corporativo", "Fretamento", ProductType.Rental, 2800m, 999),
                ("Locação de Van - Casamento", "Fretamento", ProductType.Rental, 1100m, 999),
                ("Pastilha de Freio Dianteira", "Peças", ProductType.Sale, 180m, 40),
                ("Pastilha de Freio Traseira", "Peças", ProductType.Sale, 160m, 40),
                ("Óleo Motor 15W40 (Galão 20L)", "Peças", ProductType.Sale, 420m, 25),
                ("Filtro de Óleo", "Peças", ProductType.Sale, 65m, 60),
                ("Filtro de Ar", "Peças", ProductType.Sale, 95m, 50),
                ("Filtro de Combustível Diesel", "Peças", ProductType.Sale, 110m, 50),
                ("Pneu 295/80R22.5", "Peças", ProductType.Sale, 2350m, 30),
                ("Correia Dentada", "Peças", ProductType.Sale, 280m, 25),
                ("Bateria 150Ah", "Peças", ProductType.Sale, 890m, 20),
                ("Fluido de Freio DOT4", "Peças", ProductType.Sale, 45m, 40),
                ("Diesel S10 (Litro)", "Combustível", ProductType.Sale, 6.2m, 5000),
                ("Diesel Comum (Litro)", "Combustível", ProductType.Sale, 5.9m, 5000),
            };

            return catalog
                .Select(
                    (p, i) =>
                        new Product
                        {
                            Id = Guid.NewGuid(),
                            Sku = $"SKU-{i + 1:D4}",
                            Name = p.Name,
                            Description = p.Name,
                            Photo = string.Empty,
                            Price = p.Price,
                            Category = p.Category,
                            Unit = ProductUnit.Unit,
                            Type = p.Type,
                            QuantityInStock = p.Stock,
                        }
                )
                .ToList();
        }

        private static List<Driver> BuildDrivers(Faker faker, DateTime now)
        {
            var result = new List<Driver>();

            for (var i = 0; i < 10; i++)
            {
                var firstName = faker.Name.FirstName();
                var lastName = faker.Name.LastName();

                // Two drivers have a licence expiring soon, to show off the expiry-alert feature.
                var expiringSoon = i < 2;

                result.Add(
                    new Driver
                    {
                        Id = Guid.NewGuid(),
                        Name = $"{firstName} {lastName}",
                        Email = faker.Internet.Email(firstName, lastName),
                        Phone = faker.Phone.PhoneNumber("(##) ####-####"),
                        Mobile = faker.Phone.PhoneNumber("(##) 9####-####"),
                        Photo = string.Empty,
                        SocialSecurityCard = faker.Random.Replace("###.###.###-##"),
                        NationalIdCard = faker.Random.Replace("##.###.###-#"),
                        Birthday = faker.Date.Past(35, now.AddYears(-21)),
                        LicenseNumber = faker.Random.Replace("###########"),
                        LicenseCategory = faker.Random.Bool(0.7f) ? "D" : "E",
                        LicenseExpiryDate = expiringSoon
                            ? now.AddDays(faker.Random.Number(5, 20))
                            : now.AddMonths(faker.Random.Number(6, 30)),
                        EmploymentType = faker.PickRandom(
                            EmploymentType.CLT,
                            EmploymentType.Outsourced,
                            EmploymentType.Autonomous
                        ),
                        AdmissionDate = now.AddMonths(-faker.Random.Number(3, 96)),
                        Status = i == 9 ? DriverStatus.OnLeave : DriverStatus.Active,
                        CommissionPercentage = faker.Random.Decimal(6, 15),
                    }
                );
            }

            return result;
        }

        private static List<Vehicle> BuildVehicles(Faker faker)
        {
            var models = new (string Brand, string Model, VehicleType Type, int Seats)[]
            {
                ("Marcopolo", "Paradiso 1200", VehicleType.Bus, 46),
                ("Mercedes-Benz", "OF-1721", VehicleType.Bus, 44),
                ("Comil", "Campione 3.65", VehicleType.Bus, 46),
                ("Neobus", "Thunder+", VehicleType.Bus, 42),
                ("Volkswagen", "17.230 EOD", VehicleType.MiniBus, 28),
                ("Mercedes-Benz", "Sprinter 415", VehicleType.Van, 16),
                ("Fiat", "Ducato Minibus", VehicleType.Van, 15),
                ("Renault", "Master Executivo", VehicleType.Van, 15),
                ("Chevrolet", "Spin", VehicleType.Car, 5),
                ("Toyota", "Hilux SW4", VehicleType.Car, 7),
            };

            return models
                .Select(
                    (m, i) =>
                        new Vehicle
                        {
                            Id = Guid.NewGuid(),
                            Plate = faker.Random.Replace("???-####").ToUpperInvariant(),
                            Renavam = faker.Random.Replace("###########"),
                            Chassis = faker.Random.Replace("#################").ToUpperInvariant(),
                            Brand = m.Brand,
                            Model = m.Model,
                            ManufactureYear = faker.Random.Number(2016, 2024),
                            ModelYear = faker.Random.Number(2017, 2025),
                            SeatCapacity = m.Seats,
                            Type = m.Type,
                            // one vehicle blocked, to show off the fleet-alert feature
                            Status = i == 9 ? VehicleStatus.Blocked : VehicleStatus.Available,
                            PricePerKm = faker.Random.Decimal(3.5m, 7.5m),
                            DailyRate = faker.Random.Decimal(600m, 2600m),
                            Odometer = faker.Random.Number(15000, 220000),
                            Photo = string.Empty,
                        }
                )
                .ToList();
        }

        #endregion

        #region Quote / QuoteProduct

        private static List<Quote> BuildQuotes(
            Faker faker,
            List<BusinessPartner> clients,
            DateTime now,
            out List<QuoteProduct> quoteProducts,
            List<Product> clientProducts
        )
        {
            var quotes = new List<Quote>();
            quoteProducts = new List<QuoteProduct>();

            var statuses = new[]
            {
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Converted,
                QuoteStatus.Open,
                QuoteStatus.Open,
                QuoteStatus.Open,
                QuoteStatus.Open,
                QuoteStatus.Open,
                QuoteStatus.Open,
                QuoteStatus.Expired,
                QuoteStatus.Expired,
                QuoteStatus.Expired,
                QuoteStatus.Canceled,
                QuoteStatus.Canceled,
                QuoteStatus.Canceled,
            };

            for (var i = 0; i < statuses.Length; i++)
            {
                var client = faker.PickRandom(clients);
                var quote = new Quote
                {
                    Id = Guid.NewGuid(),
                    QuoteNumber = $"ORC-Q{i + 1:D5}",
                    Date = now.AddDays(-faker.Random.Number(1, 150)),
                    Status = statuses[i],
                    Description = "Orçamento de prestação de serviços de transporte.",
                    BusinessPartnerId = client.Id,
                    Condition = faker.PickRandom(PaymentCondition.FullPayment, PaymentCondition.InInstallments),
                    Method = faker.PickRandom(
                        PaymentMethod.Cash,
                        PaymentMethod.Pix,
                        PaymentMethod.CreditCard,
                        PaymentMethod.DebitCard
                    ),
                };

                var items = faker.PickRandom(clientProducts, faker.Random.Number(1, 3)).ToList();
                decimal price = 0m;
                decimal total = 0m;

                foreach (var product in items)
                {
                    var quantity = faker.Random.Number(1, 3);
                    var discount = faker.Random.Number(0, 10);

                    quoteProducts.Add(
                        new QuoteProduct
                        {
                            Id = Guid.NewGuid(),
                            Quantity = quantity,
                            Discount = discount,
                            Price = product.Price * quantity,
                            Status = OrderProductStatus.InProgress,
                            QuoteId = quote.Id,
                            ProductId = product.Id,
                        }
                    );

                    price += product.Price * quantity;
                    total += product.Price * quantity * (1 - discount / 100m);
                }

                // Same generated-column caveat as Order.TotalPrice below: Discount has to be a
                // percentage (0-100), not an absolute amount.
                quote.Price = price;
                quote.Discount = price > 0 ? Math.Round((price - total) / price * 100, 2) : 0;
                quote.TotalOfPayments = 1;
                quote.PaymentTotalPrice = total;
                quote.TotalOfExpenses = 0;
                quote.ExpenseTotalPrice = 0;

                quotes.Add(quote);
            }

            return quotes;
        }

        #endregion

        #region Order / Transaction / OrderProduct / Payment

        private static List<Order> BuildOrders(
            Faker faker,
            List<BusinessPartner> clients,
            List<Quote> convertedQuotes,
            DateTime now,
            out List<Transaction> transactions
        )
        {
            var orders = new List<Order>();
            transactions = new List<Transaction>();

            // Kept well above totalPurchaseOrders/BuildExpenses volume (see BuildPurchaseOrders,
            // BuildExpenses) so demo incoming payments clearly outweigh outgoing ones - purchase
            // orders buy in bulk (5-20 units/line) while orders sell in small quantities
            // (1-3 units/line), so matching order counts alone isn't enough to flip the balance.
            const int totalOrders = 130;

            for (var i = 0; i < totalOrders; i++)
            {
                var client = faker.PickRandom(clients);
                var orderDate = now.AddDays(-faker.Random.Number(0, 150));
                var quote = i < convertedQuotes.Count ? convertedQuotes[i] : null;

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    Date = orderDate,
                    Description = "Transação do Pedido de Venda",
                    BusinessPartnerId = client.Id,
                };
                transactions.Add(transaction);

                var order = new Order
                {
                    Id = Guid.NewGuid(),
                    OrderNumber = $"PED-{i + 1:D5}",
                    QuoteNumber = quote?.QuoteNumber ?? string.Empty,
                    Date = orderDate,
                    Status = faker.PickRandom(OrderStatus.Open, OrderStatus.Closed, OrderStatus.WaitingPayment),
                    Description = "Pedido de venda de produtos/serviços.",
                    BusinessPartnerId = client.Id,
                    TransactionId = transaction.Id,
                };

                orders.Add(order);
            }

            return orders;
        }

        private static List<Trip> BuildTrips(
            Faker faker,
            List<BusinessPartner> clients,
            List<Driver> drivers,
            List<Vehicle> vehicles,
            DateTime now,
            out List<Transaction> transactions
        )
        {
            var routes = new[]
            {
                "São Paulo → Campos do Jordão",
                "São Paulo → Ilhabela",
                "São Paulo → Ubatuba",
                "São Paulo → Águas de Lindóia",
                "São Paulo → Aparecida do Norte",
                "São Paulo → Guarujá",
                "São Paulo → Serra Negra",
                "São Paulo → Socorro",
            };

            var trips = new List<Trip>();
            transactions = new List<Transaction>();

            var activeDrivers = drivers.Where(d => d.Status == DriverStatus.Active).ToList();
            var availableVehicles = vehicles.Where(v => v.Status != VehicleStatus.Blocked).ToList();

            // Raised alongside totalOrders (see BuildOrders) to boost incoming volume - each trip
            // nets far more incoming (its own payments) than the outgoing it adds via
            // BuildTripDrivers, so more trips also helps the income/expense balance.
            const int totalTrips = 40;

            for (var i = 0; i < totalTrips; i++)
            {
                var client = faker.PickRandom(clients);
                var tripDate = now.AddDays(-faker.Random.Number(0, 150));

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    Date = tripDate,
                    Description = "Transação da Viagem",
                    BusinessPartnerId = client.Id,
                };
                transactions.Add(transaction);

                var trip = new Trip
                {
                    Id = Guid.NewGuid(),
                    TripNumber = $"VIA-{i + 1:D5}",
                    Date = tripDate,
                    Status = faker.PickRandom(OrderStatus.Open, OrderStatus.Closed, OrderStatus.WaitingPayment),
                    BusinessPartnerId = client.Id,
                    TransactionId = transaction.Id,
                    Route = faker.PickRandom(routes),
                    DistanceKm = faker.Random.Decimal(80, 420),
                    DailyCount = faker.Random.Number(1, 3),
                    TransportLicenseNumber = faker.Random.Replace("ANTT-#######"),
                    TransportLicenseExpiryDate = now.AddMonths(faker.Random.Number(2, 24)),
                };

                if (activeDrivers.Count > 0)
                {
                    trip.DriverId = faker.PickRandom(activeDrivers).Id;
                }
                if (availableVehicles.Count > 0)
                {
                    trip.VehicleId = faker.PickRandom(availableVehicles).Id;
                }

                // Mirrors the Price formula TripService will apply when a Vehicle is assigned.
                var vehicle = availableVehicles.FirstOrDefault(v => v.Id == trip.VehicleId);
                trip.Price = vehicle != null
                    ? (vehicle.PricePerKm * trip.DistanceKm) + (vehicle.DailyRate * trip.DailyCount)
                    : faker.Random.Decimal(800, 4000);
                trip.Discount = 0;
                trip.TotalPrice = trip.Price;

                trips.Add(trip);
            }

            return trips;
        }

        // A Trip can have any number of drivers now (see TripDriver) - trip.DriverId above is
        // kept only for the existing ServiceOrder/Commission generation below, which still
        // assumes a single driver. This assigns 1-2 real drivers per trip (independent of
        // trip.DriverId) and, mirroring TripDriverService.Add, gives each one its own Outgoing
        // Payment/expense on the trip's Transaction.
        private static List<TripDriver> BuildTripDrivers(
            Faker faker,
            List<Trip> trips,
            List<Driver> drivers,
            DateTime now,
            out List<Payment> payments
        )
        {
            var result = new List<TripDriver>();
            payments = new List<Payment>();

            var activeDrivers = drivers.Where(d => d.Status == DriverStatus.Active).ToList();
            if (activeDrivers.Count == 0)
            {
                return result;
            }

            foreach (var trip in trips)
            {
                var driverCount = faker.Random.Number(1, Math.Min(2, activeDrivers.Count));
                var chosenDrivers = faker.PickRandom(activeDrivers, driverCount).ToList();

                foreach (var driver in chosenDrivers)
                {
                    var amount = faker.Random.Decimal(150, 600);

                    var payment = new Payment
                    {
                        Id = Guid.NewGuid(),
                        Type = PaymentType.Outgoing,
                        Status = PaymentStatus.Pending,
                        Condition = PaymentCondition.FullPayment,
                        Method = PaymentMethod.Cash,
                        Category = "Motorista",
                        Date = trip.Date,
                        Description = $"Pagamento Motorista - {driver.Name} - Viagem {trip.TripNumber}",
                        PaymentNumber = 1,
                        Price = amount,
                        TransactionId = trip.TransactionId,
                        TripId = trip.Id,
                        DriverId = driver.Id,
                    };
                    payments.Add(payment);

                    result.Add(
                        new TripDriver
                        {
                            Id = Guid.NewGuid(),
                            TripId = trip.Id,
                            DriverId = driver.Id,
                            Amount = amount,
                            PaymentId = payment.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<OrderProduct> BuildOrderProducts(
            Faker faker,
            List<Order> orders,
            List<Product> clientProducts
        )
        {
            var result = new List<OrderProduct>();

            foreach (var order in orders)
            {
                var items = faker.PickRandom(clientProducts, faker.Random.Number(1, 3)).ToList();
                decimal price = 0m;
                decimal total = 0m;

                foreach (var product in items)
                {
                    var quantity = faker.Random.Number(1, 3);
                    var discount = faker.Random.Number(0, 10);

                    result.Add(
                        new OrderProduct
                        {
                            Id = Guid.NewGuid(),
                            Description = product.Name,
                            Quantity = quantity,
                            Discount = discount,
                            Price = product.Price * quantity,
                            OrderId = order.Id,
                            ProductId = product.Id,
                        }
                    );

                    price += product.Price * quantity;
                    total += product.Price * quantity * (1 - discount / 100m);
                }

                // TotalPrice is a MySQL generated column, (Price - Price * Discount / 100) - it
                // treats Discount as a PERCENTAGE, not an absolute amount, so Discount has to be
                // stored as one here or TotalPrice comes back wildly wrong (and negative) once EF
                // re-reads the row after SaveChangesAsync().
                order.Price = price;
                order.Discount = price > 0 ? Math.Round((price - total) / price * 100, 2) : 0;
            }

            return result;
        }

        private static List<Payment> BuildPayments(Faker faker, List<Order> orders, DateTime now)
        {
            var result = new List<Payment>();

            foreach (var order in orders)
            {
                var installments = faker.Random.Number(1, 4);
                var installmentAmount = Math.Round(order.TotalPrice / installments, 2);
                var method = faker.PickRandom(
                    PaymentMethod.Cash,
                    PaymentMethod.Pix,
                    PaymentMethod.CreditCard,
                    PaymentMethod.DebitCard
                );

                for (var n = 1; n <= installments; n++)
                {
                    var dueDate = order.Date.AddDays(30 * n);
                    var status = dueDate < now
                        ? faker.PickRandom(PaymentStatus.Approved, PaymentStatus.Approved, PaymentStatus.Delayed)
                        : PaymentStatus.Pending;

                    result.Add(
                        new Payment
                        {
                            Id = Guid.NewGuid(),
                            Type = PaymentType.Incoming,
                            Status = status,
                            Condition = installments > 1 ? PaymentCondition.InInstallments : PaymentCondition.FullPayment,
                            Method = method,
                            Category = "Venda",
                            Date = dueDate,
                            Description = $"Parcela {n}/{installments} - Pedido {order.OrderNumber}",
                            PaymentNumber = n,
                            Price = installmentAmount,
                            TransactionId = order.TransactionId,
                            BusinessPartnerId = order.BusinessPartnerId,
                            OrderId = order.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<Payment> BuildTripPayments(Faker faker, List<Trip> trips, DateTime now)
        {
            var result = new List<Payment>();

            foreach (var trip in trips)
            {
                var installments = faker.Random.Number(1, 4);
                var installmentAmount = Math.Round(trip.TotalPrice / installments, 2);
                var method = faker.PickRandom(
                    PaymentMethod.Cash,
                    PaymentMethod.Pix,
                    PaymentMethod.CreditCard,
                    PaymentMethod.DebitCard
                );

                for (var n = 1; n <= installments; n++)
                {
                    var dueDate = trip.Date.AddDays(30 * n);
                    var status = dueDate < now
                        ? faker.PickRandom(PaymentStatus.Approved, PaymentStatus.Approved, PaymentStatus.Delayed)
                        : PaymentStatus.Pending;

                    result.Add(
                        new Payment
                        {
                            Id = Guid.NewGuid(),
                            Type = PaymentType.Incoming,
                            Status = status,
                            Condition = installments > 1 ? PaymentCondition.InInstallments : PaymentCondition.FullPayment,
                            Method = method,
                            Category = "Viagem",
                            Date = dueDate,
                            Description = $"Parcela {n}/{installments} - Viagem {trip.TripNumber}",
                            PaymentNumber = n,
                            Price = installmentAmount,
                            TransactionId = trip.TransactionId,
                            BusinessPartnerId = trip.BusinessPartnerId,
                            TripId = trip.Id,
                        }
                    );
                }
            }

            return result;
        }

        // "Despesas" in the UI is just /payments?type=Outgoing - the same Payment entity filtered
        // client-side by Type, not a separate module. Unlike Order/Trip payments (installments on
        // an existing sales transaction), an expense has no natural parent order - so it gets its
        // own standalone Transaction against a Supplier, the same way a real "pay this supplier's
        // bill" entry would be created from the Transactions screen.
        private static List<Payment> BuildExpenses(
            Faker faker,
            List<BusinessPartner> suppliers,
            DateTime now,
            out List<Transaction> transactions
        )
        {
            var result = new List<Payment>();
            transactions = new List<Transaction>();

            var categories = new[]
            {
                "Peças",
                "Combustível",
                "Manutenção",
                "Serviço Terceirizado",
                "Aluguel",
                "Material de Escritório",
            };

            foreach (var supplier in suppliers)
            {
                var expenseCount = faker.Random.Number(2, 4);

                for (var n = 0; n < expenseCount; n++)
                {
                    // Mostly past bills (Approved/Delayed), with a few due shortly in the future
                    // (Pending) - same status mix BuildPayments gets from installment due dates.
                    var expenseDate = now.AddDays(faker.Random.Number(-150, 20));
                    var category = faker.PickRandom(categories);
                    var method = faker.PickRandom(
                        PaymentMethod.Cash,
                        PaymentMethod.Pix,
                        PaymentMethod.CreditCard,
                        PaymentMethod.DebitCard
                    );

                    var transaction = new Transaction
                    {
                        Id = Guid.NewGuid(),
                        Date = expenseDate,
                        Description = $"Despesa - {category} - {supplier.Name}",
                        BusinessPartnerId = supplier.Id,
                    };
                    transactions.Add(transaction);

                    var status = expenseDate < now
                        ? faker.PickRandom(PaymentStatus.Approved, PaymentStatus.Approved, PaymentStatus.Delayed)
                        : PaymentStatus.Pending;

                    result.Add(
                        new Payment
                        {
                            Id = Guid.NewGuid(),
                            Type = PaymentType.Outgoing,
                            Status = status,
                            Condition = PaymentCondition.FullPayment,
                            Method = method,
                            Category = category,
                            Date = expenseDate,
                            Description = $"{category} - {supplier.Name}",
                            PaymentNumber = 1,
                            Price = faker.Random.Decimal(80, 3500),
                            TransactionId = transaction.Id,
                            BusinessPartnerId = supplier.Id,
                        }
                    );
                }
            }

            return result;
        }

        // Mirrors BuildOrders, buying back from Suppliers instead of selling to Clients - no
        // Quote conversion equivalent here, purchase orders start from scratch.
        private static List<PurchaseOrder> BuildPurchaseOrders(
            Faker faker,
            List<BusinessPartner> suppliers,
            DateTime now,
            out List<Transaction> transactions
        )
        {
            var purchaseOrders = new List<PurchaseOrder>();
            transactions = new List<Transaction>();

            if (suppliers.Count == 0)
            {
                return purchaseOrders;
            }

            const int totalPurchaseOrders = 15;

            for (var i = 0; i < totalPurchaseOrders; i++)
            {
                var supplier = faker.PickRandom(suppliers);
                var purchaseOrderDate = now.AddDays(-faker.Random.Number(0, 150));

                var transaction = new Transaction
                {
                    Id = Guid.NewGuid(),
                    Date = purchaseOrderDate,
                    Description = "Transação do Pedido de Compra",
                    BusinessPartnerId = supplier.Id,
                };
                transactions.Add(transaction);

                var purchaseOrder = new PurchaseOrder
                {
                    Id = Guid.NewGuid(),
                    PurchaseOrderNumber = $"COM-{i + 1:D5}",
                    Date = purchaseOrderDate,
                    Status = faker.PickRandom(OrderStatus.Open, OrderStatus.Closed, OrderStatus.WaitingPayment),
                    Description = "Pedido de compra de produtos para reposição de estoque.",
                    BusinessPartnerId = supplier.Id,
                    TransactionId = transaction.Id,
                };

                purchaseOrders.Add(purchaseOrder);
            }

            return purchaseOrders;
        }

        // Mirrors BuildOrderProducts - draws from the full product catalog (including "Peças",
        // unlike client-facing orders) since a purchase order's whole point is replenishing stock,
        // parts included.
        private static List<PurchaseOrderProduct> BuildPurchaseOrderProducts(
            Faker faker,
            List<PurchaseOrder> purchaseOrders,
            List<Product> products
        )
        {
            var result = new List<PurchaseOrderProduct>();

            foreach (var purchaseOrder in purchaseOrders)
            {
                var items = faker.PickRandom(products, faker.Random.Number(1, 3)).ToList();
                decimal price = 0m;
                decimal total = 0m;

                foreach (var product in items)
                {
                    var quantity = faker.Random.Number(5, 20);
                    var discount = faker.Random.Number(0, 10);

                    result.Add(
                        new PurchaseOrderProduct
                        {
                            Id = Guid.NewGuid(),
                            Description = product.Name,
                            Quantity = quantity,
                            Discount = discount,
                            Price = product.Price * quantity,
                            PurchaseOrderId = purchaseOrder.Id,
                            ProductId = product.Id,
                        }
                    );

                    price += product.Price * quantity;
                    total += product.Price * quantity * (1 - discount / 100m);
                }

                // Same MySQL generated-column caveat as Order.Discount - see BuildOrderProducts.
                purchaseOrder.Price = price;
                purchaseOrder.Discount = price > 0 ? Math.Round((price - total) / price * 100, 2) : 0;
            }

            return result;
        }

        // Mirrors BuildPayments, but Outgoing (a purchase order is money leaving the business).
        private static List<Payment> BuildPurchaseOrderPayments(
            Faker faker,
            List<PurchaseOrder> purchaseOrders,
            DateTime now
        )
        {
            var result = new List<Payment>();

            foreach (var purchaseOrder in purchaseOrders)
            {
                var installments = faker.Random.Number(1, 3);
                var installmentAmount = Math.Round(purchaseOrder.TotalPrice / installments, 2);
                var method = faker.PickRandom(
                    PaymentMethod.Cash,
                    PaymentMethod.Pix,
                    PaymentMethod.CreditCard,
                    PaymentMethod.DebitCard
                );

                for (var n = 1; n <= installments; n++)
                {
                    var dueDate = purchaseOrder.Date.AddDays(30 * n);
                    var status = dueDate < now
                        ? faker.PickRandom(PaymentStatus.Approved, PaymentStatus.Approved, PaymentStatus.Delayed)
                        : PaymentStatus.Pending;

                    result.Add(
                        new Payment
                        {
                            Id = Guid.NewGuid(),
                            Type = PaymentType.Outgoing,
                            Status = status,
                            Condition = installments > 1 ? PaymentCondition.InInstallments : PaymentCondition.FullPayment,
                            Method = method,
                            Category = "Compra",
                            Date = dueDate,
                            Description = $"Parcela {n}/{installments} - Pedido de Compra {purchaseOrder.PurchaseOrderNumber}",
                            PaymentNumber = n,
                            Price = installmentAmount,
                            TransactionId = purchaseOrder.TransactionId,
                            BusinessPartnerId = purchaseOrder.BusinessPartnerId,
                            PurchaseOrderId = purchaseOrder.Id,
                        }
                    );
                }
            }

            return result;
        }

        #endregion

        #region TripLeg / Passenger / FuelLog / VehicleMaintenance

        private static List<TripLeg> BuildTripLegs(Faker faker, List<Trip> trips)
        {
            var result = new List<TripLeg>();

            foreach (var trip in trips)
            {
                var legCount = faker.Random.Number(1, 2);
                var parts = (trip.Route ?? "Origem → Destino").Split('→');
                var origin = parts.Length > 0 ? parts[0].Trim() : "Garagem";
                var destination = parts.Length > 1 ? parts[1].Trim() : "Destino";

                for (var n = 1; n <= legCount; n++)
                {
                    var departure = trip.Date.AddDays(n - 1).AddHours(faker.Random.Number(5, 9));

                    result.Add(
                        new TripLeg
                        {
                            Id = Guid.NewGuid(),
                            SequenceNumber = n,
                            Origin = n == 1 ? origin : destination,
                            Destination = n == 1 ? destination : origin,
                            DepartureDate = departure,
                            ArrivalDate = departure.AddHours(faker.Random.Number(2, 6)),
                            DistanceKm = trip.DistanceKm > 0 ? trip.DistanceKm / legCount : faker.Random.Decimal(50, 200),
                            Notes = string.Empty,
                            TripId = trip.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<Passenger> BuildPassengers(Faker faker, List<Trip> trips)
        {
            var result = new List<Passenger>();

            foreach (var trip in trips)
            {
                var passengerCount = faker.Random.Number(2, 4);

                for (var n = 1; n <= passengerCount; n++)
                {
                    result.Add(
                        new Passenger
                        {
                            Id = Guid.NewGuid(),
                            Name = faker.Name.FullName(),
                            DocumentNumber = faker.Random.Replace("###.###.###-##"),
                            Seat = n.ToString(),
                            Phone = faker.Phone.PhoneNumber("(##) 9####-####"),
                            TripId = trip.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<FuelLog> BuildFuelLogs(
            Faker faker,
            List<Vehicle> vehicles,
            List<Product> fuelProducts,
            DateTime now
        )
        {
            var result = new List<FuelLog>();

            foreach (var vehicle in vehicles)
            {
                var entries = faker.Random.Number(1, 3);

                for (var n = 0; n < entries; n++)
                {
                    var liters = faker.Random.Decimal(120, 400);
                    var pricePerLiter = faker.Random.Decimal(5.8m, 6.6m);
                    var status = faker.PickRandom("Concluído", "Concluído", "Agendado", "Cancelado");
                    var product = fuelProducts.Count > 0 ? faker.PickRandom(fuelProducts) : null;

                    result.Add(
                        new FuelLog
                        {
                            Id = Guid.NewGuid(),
                            Date = now.AddDays(-faker.Random.Number(1, 120)),
                            Odometer = vehicle.Odometer - faker.Random.Number(0, 5000),
                            Liters = liters,
                            PricePerLiter = pricePerLiter,
                            TotalCost = Math.Round(liters * pricePerLiter, 2),
                            GasStation = faker.PickRandom(
                                "Posto Ipiranga - Rod. Dom Pedro I",
                                "Posto Shell - Marginal Tietê",
                                "Posto Raízen - Via Anchieta",
                                "Posto Petrobras - Rodovia Anhanguera"
                            ),
                            Status = status,
                            VehicleId = vehicle.Id,
                            ProductId = product?.Id,
                            ProductSku = product?.Sku,
                            ProductName = product?.Name,
                        }
                    );
                }
            }

            return result;
        }

        private static List<VehicleMaintenance> BuildVehicleMaintenances(
            Faker faker,
            List<Vehicle> vehicles,
            List<Product> partProducts,
            DateTime now,
            out List<VehicleMaintenanceProduct> maintenanceProducts
        )
        {
            var result = new List<VehicleMaintenance>();
            maintenanceProducts = new List<VehicleMaintenanceProduct>();

            foreach (var vehicle in vehicles)
            {
                var count = faker.Random.Number(1, 3);

                for (var n = 0; n < count; n++)
                {
                    var status = faker.PickRandom(
                        MaintenanceStatus.Completed,
                        MaintenanceStatus.Completed,
                        MaintenanceStatus.Scheduled,
                        MaintenanceStatus.Overdue
                    );
                    var scheduled = status == MaintenanceStatus.Overdue
                        ? now.AddDays(-faker.Random.Number(3, 20))
                        : status == MaintenanceStatus.Completed
                            ? now.AddDays(-faker.Random.Number(10, 180))
                            : now.AddDays(faker.Random.Number(5, 45));

                    var usePart = faker.Random.Bool(0.6f) && partProducts.Count > 0;
                    var part = usePart ? faker.PickRandom(partProducts) : null;
                    var partQuantity = usePart ? faker.Random.Number(1, 4) : 0;

                    var maintenance = new VehicleMaintenance
                    {
                        Id = Guid.NewGuid(),
                        Type = faker.PickRandom(MaintenanceType.Preventive, MaintenanceType.Corrective),
                        Description = usePart
                            ? $"Substituição de {part!.Name}"
                            : "Revisão geral programada",
                        ScheduledDate = scheduled,
                        CompletedDate = status == MaintenanceStatus.Completed ? scheduled : null,
                        OdometerAtService = vehicle.Odometer - faker.Random.Number(0, 8000),
                        Cost = usePart ? part!.Price * partQuantity : faker.Random.Decimal(150, 900),
                        Status = status,
                        VehicleId = vehicle.Id,
                    };
                    result.Add(maintenance);

                    if (usePart)
                    {
                        maintenanceProducts.Add(
                            new VehicleMaintenanceProduct
                            {
                                Id = Guid.NewGuid(),
                                Description = part!.Name,
                                Quantity = partQuantity,
                                Price = part.Price,
                                Discount = 0,
                                VehicleMaintenanceId = maintenance.Id,
                                ProductId = part.Id,
                            }
                        );
                    }
                }
            }

            return result;
        }

        #endregion

        #region ServiceOrder / Commission

        private static List<ServiceOrder> BuildServiceOrders(List<Trip> trips, DateTime now)
        {
            var result = new List<ServiceOrder>();
            var withDriver = trips.Where(t => t.DriverId.HasValue).ToList();

            for (var i = 0; i < withDriver.Count; i++)
            {
                var trip = withDriver[i];
                var completed = trip.Status == OrderStatus.Closed;

                result.Add(
                    new ServiceOrder
                    {
                        Id = Guid.NewGuid(),
                        Number = $"OS-{i + 1:D5}",
                        IssueDate = trip.Date,
                        CompletionDate = completed ? trip.Date.AddDays(trip.DailyCount > 0 ? trip.DailyCount : 1) : null,
                        Description = $"OS gerada para a viagem {trip.TripNumber}.",
                        Status = completed ? ServiceOrderStatus.Completed : ServiceOrderStatus.Open,
                        TripId = trip.Id,
                        DriverId = trip.DriverId!.Value,
                        VehicleId = trip.VehicleId,
                    }
                );
            }

            return result;
        }

        private static List<Commission> BuildCommissions(
            Faker faker,
            List<ServiceOrder> serviceOrders,
            List<Driver> drivers,
            DateTime now
        )
        {
            var result = new List<Commission>();
            var driverById = drivers.ToDictionary(d => d.Id, d => d);

            foreach (var serviceOrder in serviceOrders.Where(so => so.Status == ServiceOrderStatus.Completed))
            {
                if (!driverById.TryGetValue(serviceOrder.DriverId, out var driver))
                {
                    continue;
                }

                // Rough base amount for demo purposes - the daily rate of a mid-range fretamento.
                var baseAmount = faker.Random.Decimal(1200, 3800);
                var amount = Math.Round(baseAmount * driver.CommissionPercentage / 100m, 2);

                result.Add(
                    new Commission
                    {
                        Id = Guid.NewGuid(),
                        Percentage = driver.CommissionPercentage,
                        BaseAmount = baseAmount,
                        Amount = amount,
                        Status = faker.PickRandom(CommissionStatus.Paid, CommissionStatus.Paid, CommissionStatus.Pending),
                        PaidDate = faker.Random.Bool(0.6f) ? serviceOrder.CompletionDate : null,
                        ServiceOrderId = serviceOrder.Id,
                        DriverId = driver.Id,
                    }
                );
            }

            return result;
        }

        #endregion

        #region Event / EventParticipant

        private static List<Event> BuildEvents(
            Faker faker,
            DateTime now,
            List<SelectableOption> eventTypeOptions,
            List<User> systemUsers,
            string adminUserId,
            List<BusinessPartner> businessPartners,
            List<Quote> quotes,
            List<Order> orders,
            List<PurchaseOrder> purchaseOrders,
            List<Trip> trips,
            List<Transaction> transactions,
            List<Payment> payments,
            List<Vehicle> vehicles,
            List<Driver> drivers,
            List<VehicleMaintenance> maintenances,
            List<FuelLog> fuelLogs,
            out List<EventParticipant> eventParticipants
        )
        {
            var events = new List<Event>();
            var participants = new List<EventParticipant>();

            Guid TypeId(string value) =>
                eventTypeOptions.FirstOrDefault(o => o.Value == value)?.Id
                ?? eventTypeOptions.First().Id;

            var meetingType = TypeId("Reunião");
            var deadlineType = TypeId("Prazo");
            var reminderType = TypeId("Lembrete");
            var birthdayType = TypeId("Aniversário");
            var otherType = TypeId("Outro");

            void AddParticipants(
                Event evt,
                params (string? UserId, string? Name, string? Email)[] people
            )
            {
                foreach (var person in people)
                {
                    participants.Add(
                        new EventParticipant
                        {
                            Id = Guid.NewGuid(),
                            EventId = evt.Id,
                            UserId = person.UserId,
                            Name = person.Name,
                            Email = person.Email,
                        }
                    );
                }
            }

            DateTime NextOccurrence(DateTime birthday)
            {
                var next = new DateTime(now.Year, birthday.Month, birthday.Day);
                return next < now.Date ? next.AddYears(1) : next;
            }

            // BusinessPartner - birthday reminders for individual clients/suppliers.
            foreach (var bp in businessPartners.OfType<Individual>().Take(3))
            {
                var start = NextOccurrence(bp.Birthday).AddHours(9);

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Aniversário de {bp.Name}",
                        Description = "Lembrete de aniversário do cliente/fornecedor.",
                        StartDate = start,
                        EndDate = start.AddMinutes(30),
                        EventTypeOptionId = birthdayType,
                        CreatedByUserId = adminUserId,
                        BusinessPartnerId = bp.Id,
                    }
                );
            }

            // Quote - follow-up call on still-open quotes.
            foreach (var quote in quotes.Where(q => q.Status == QuoteStatus.Open).Take(3))
            {
                var start = quote.Date.AddDays(faker.Random.Number(3, 10));
                var evt = new Event
                {
                    Id = Guid.NewGuid(),
                    Title = $"Follow-up do orçamento {quote.QuoteNumber}",
                    Description = "Ligar para o cliente e confirmar interesse no orçamento.",
                    StartDate = start,
                    EndDate = start.AddMinutes(30),
                    EventTypeOptionId = deadlineType,
                    CreatedByUserId = adminUserId,
                    QuoteId = quote.Id,
                };
                events.Add(evt);

                if (systemUsers.Count > 0)
                {
                    AddParticipants(evt, (faker.PickRandom(systemUsers).Id, null, null));
                }
            }

            // Order - delivery/service confirmation on open orders.
            foreach (var order in orders.Where(o => o.Status == OrderStatus.Open).Take(3))
            {
                var start = order.Date.AddDays(faker.Random.Number(2, 15));

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Entrega do pedido {order.OrderNumber}",
                        Description = "Confirmar entrega/serviço prestado ao cliente.",
                        StartDate = start,
                        EndDate = start.AddHours(1),
                        EventTypeOptionId = deadlineType,
                        CreatedByUserId = adminUserId,
                        OrderId = order.Id,
                    }
                );
            }

            // PurchaseOrder - receiving confirmation on open purchase orders.
            foreach (var po in purchaseOrders.Where(p => p.Status == OrderStatus.Open).Take(2))
            {
                var start = po.Date.AddDays(faker.Random.Number(2, 10));

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Recebimento da compra {po.PurchaseOrderNumber}",
                        Description = "Conferir mercadoria recebida do fornecedor.",
                        StartDate = start,
                        EndDate = start.AddHours(1),
                        EventTypeOptionId = deadlineType,
                        CreatedByUserId = adminUserId,
                        PurchaseOrderId = po.Id,
                    }
                );
            }

            // Trip - departure alignment meeting, with the driver and client as freeform
            // participants (neither is a system User, so both go in as Name/Email contacts).
            foreach (var trip in trips.Take(3))
            {
                var start = trip.Date.AddDays(-1).AddHours(16);
                var evt = new Event
                {
                    Id = Guid.NewGuid(),
                    Title = $"Alinhamento da viagem {trip.TripNumber}",
                    Description =
                        "Confirmar roteiro, horários e ponto de embarque com motorista e cliente.",
                    StartDate = start,
                    EndDate = start.AddHours(1),
                    EventTypeOptionId = meetingType,
                    CreatedByUserId = adminUserId,
                    TripId = trip.Id,
                };
                events.Add(evt);

                var driver = trip.DriverId.HasValue
                    ? drivers.FirstOrDefault(d => d.Id == trip.DriverId.Value)
                    : null;
                var client = businessPartners.FirstOrDefault(bp => bp.Id == trip.BusinessPartnerId);
                var people = new List<(string?, string?, string?)>();
                if (driver != null)
                {
                    people.Add((null, driver.Name, driver.Email));
                }
                if (client != null)
                {
                    people.Add((null, client.Name, client.Email));
                }
                if (people.Count > 0)
                {
                    AddParticipants(evt, people.ToArray());
                }
            }

            // Transaction - review reminder for standalone transactions (expenses), which aren't
            // already covered by an Order/PurchaseOrder/Trip event above.
            foreach (
                var transaction in transactions
                    .Where(t => t.OrderId == null && t.PurchaseOrderId == null && t.TripId == null)
                    .Take(2)
            )
            {
                var start = transaction.Date.AddDays(faker.Random.Number(1, 5));

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = "Revisar transação",
                        Description = transaction.Description,
                        StartDate = start,
                        EndDate = start.AddMinutes(30),
                        EventTypeOptionId = reminderType,
                        CreatedByUserId = adminUserId,
                        TransactionId = transaction.Id,
                    }
                );
            }

            // Payment - due-date reminder for pending payments.
            foreach (var payment in payments.Where(p => p.Status == PaymentStatus.Pending).Take(3))
            {
                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = "Vencimento de pagamento",
                        Description = payment.Description,
                        StartDate = payment.Date,
                        EndDate = payment.Date.AddMinutes(30),
                        EventTypeOptionId = deadlineType,
                        CreatedByUserId = adminUserId,
                        PaymentId = payment.Id,
                    }
                );
            }

            // Vehicle - documentation/licensing check reminder.
            foreach (var vehicle in vehicles.Take(2))
            {
                var start = now.AddDays(faker.Random.Number(10, 60));

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Verificar documentação - {vehicle.Plate}",
                        Description = "Checar validade de licenciamento e seguro do veículo.",
                        StartDate = start,
                        EndDate = start.AddMinutes(30),
                        EventTypeOptionId = otherType,
                        CreatedByUserId = adminUserId,
                        VehicleId = vehicle.Id,
                    }
                );
            }

            // Driver - birthday reminders.
            foreach (var driver in drivers.Take(2))
            {
                var start = NextOccurrence(driver.Birthday).AddHours(9);

                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Aniversário de {driver.Name}",
                        Description = "Lembrete de aniversário do motorista.",
                        StartDate = start,
                        EndDate = start.AddMinutes(30),
                        EventTypeOptionId = birthdayType,
                        CreatedByUserId = adminUserId,
                        DriverId = driver.Id,
                    }
                );
            }

            // VehicleMaintenance - reminder for maintenances still scheduled ahead.
            foreach (
                var maintenance in maintenances
                    .Where(m => m.Status == MaintenanceStatus.Scheduled)
                    .Take(3)
            )
            {
                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Manutenção agendada - {maintenance.Description}",
                        Description = "Levar o veículo à oficina no horário agendado.",
                        StartDate = maintenance.ScheduledDate,
                        EndDate = maintenance.ScheduledDate.AddHours(2),
                        EventTypeOptionId = reminderType,
                        CreatedByUserId = adminUserId,
                        VehicleMaintenanceId = maintenance.Id,
                    }
                );
            }

            // FuelLog - reminder to confirm the fuel receipt/invoice.
            foreach (var fuelLog in fuelLogs.Take(2))
            {
                events.Add(
                    new Event
                    {
                        Id = Guid.NewGuid(),
                        Title = $"Abastecimento - {fuelLog.GasStation}",
                        Description = "Confirmar nota fiscal do abastecimento.",
                        StartDate = fuelLog.Date,
                        EndDate = fuelLog.Date.AddMinutes(20),
                        EventTypeOptionId = otherType,
                        CreatedByUserId = adminUserId,
                        FuelLogId = fuelLog.Id,
                    }
                );
            }

            // One internal team meeting with every system User as a participant, to show the
            // Participantes block populated from real Users (not just freeform contacts).
            if (orders.Count > 0 && systemUsers.Count > 1)
            {
                var order = faker.PickRandom(orders);
                var start = now.Date.AddDays(faker.Random.Number(1, 7)).AddHours(10);
                var evt = new Event
                {
                    Id = Guid.NewGuid(),
                    Title = "Reunião semanal de operações",
                    Description = "Alinhamento interno da equipe.",
                    StartDate = start,
                    EndDate = start.AddHours(1),
                    EventTypeOptionId = meetingType,
                    CreatedByUserId = adminUserId,
                    OrderId = order.Id,
                };
                events.Add(evt);
                AddParticipants(
                    evt,
                    systemUsers.Select(u => (u.Id, (string?)null, (string?)null)).ToArray()
                );
            }

            eventParticipants = participants;
            return events;
        }

        #endregion

        #region Sequence

        private static async Task EnsureSequenceAsync(MyDBContextEF context, string name, long nextVal)
        {
            var existing = await context.Sequence.FirstOrDefaultAsync(s => s.Name == name);
            if (existing != null)
            {
                if (existing.NextVal < nextVal)
                {
                    existing.NextVal = nextVal;
                }
                return;
            }

            await context.Sequence.AddAsync(
                new Sequence
                {
                    Id = Guid.NewGuid(),
                    Name = name,
                    NextVal = nextVal,
                }
            );
        }

        #endregion
    }
}
