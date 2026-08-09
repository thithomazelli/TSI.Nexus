using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Bogus;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using TSI.Friday.Contracts.Enums;
using TSI.Friday.Contracts.Models;
using TSI.Friday.Data;

namespace TSI.Friday.Data.Seed
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

                var clientProducts = products.Where(p => p.Category != "Peças").ToList();
                var partProducts = products.Where(p => p.Category == "Peças").ToList();
                var clients = businessPartners.Where(bp => bp.Type == BusinessPartnerType.Client).ToList();

                // ---- Phase 4: Quotes + QuoteProducts ----
                var quotes = BuildQuotes(faker, clients, now, out var quoteProducts, clientProducts);
                await context.Quote.AddRangeAsync(quotes);
                await context.QuoteProduct.AddRangeAsync(quoteProducts);
                await context.SaveChangesAsync();

                // ---- Phase 5: Orders + Transactions ----
                var convertedQuotes = quotes.Where(q => q.Status == QuoteStatus.Converted).ToList();
                var orders = BuildOrders(
                    faker,
                    clients,
                    drivers,
                    vehicles,
                    convertedQuotes,
                    now,
                    out var transactions,
                    out var fretamentoOrders
                );
                await context.Transaction.AddRangeAsync(transactions);
                await context.Order.AddRangeAsync(orders);
                await context.SaveChangesAsync();

                // ---- Phase 6: OrderProducts (stock is adjusted for Sale/Rental products here) ----
                var orderProducts = BuildOrderProducts(faker, orders, clientProducts);
                await context.OrderProduct.AddRangeAsync(orderProducts);
                await context.SaveChangesAsync();

                // ---- Phase 7: Payments ----
                var payments = BuildPayments(faker, orders, now);
                await context.Payment.AddRangeAsync(payments);
                await context.SaveChangesAsync();

                // ---- Phase 8: TripLegs + Passengers (fretamento orders only) ----
                var tripLegs = BuildTripLegs(faker, fretamentoOrders);
                await context.TripLeg.AddRangeAsync(tripLegs);

                var passengers = BuildPassengers(faker, fretamentoOrders);
                await context.Passenger.AddRangeAsync(passengers);

                await context.SaveChangesAsync();

                // ---- Phase 9: FuelLogs ----
                var fuelLogs = BuildFuelLogs(faker, vehicles, now);
                await context.FuelLog.AddRangeAsync(fuelLogs);
                await context.SaveChangesAsync();

                // ---- Phase 10: VehicleMaintenances (part consumption adjusts stock here) ----
                var maintenances = BuildVehicleMaintenances(faker, vehicles, partProducts, now);
                await context.VehicleMaintenance.AddRangeAsync(maintenances);
                await context.SaveChangesAsync();

                // ---- Phase 11: ServiceOrders (one per fretamento order that has a Driver) ----
                var serviceOrders = BuildServiceOrders(fretamentoOrders, now);
                await context.ServiceOrder.AddRangeAsync(serviceOrders);
                await context.SaveChangesAsync();

                // ---- Phase 12: Commissions (one per completed ServiceOrder) ----
                var commissions = BuildCommissions(faker, serviceOrders, drivers, now);
                await context.Commission.AddRangeAsync(commissions);
                await context.SaveChangesAsync();

                // ---- Phase 13: Sequences - continue right after the numbers used above ----
                await EnsureSequenceAsync(context, "OrderNumberSeq", orders.Count + 1);
                await EnsureSequenceAsync(context, "QuoteNumberSeq", quotes.Count + 1);
                await context.SaveChangesAsync();

                logger?.LogInformation(
                    "DemoDataSeeder: seeded {BusinessPartners} business partners, {Products} products, "
                        + "{Drivers} drivers, {Vehicles} vehicles, {Quotes} quotes, {Orders} orders, "
                        + "{Payments} payments, {TripLegs} trip legs, {Passengers} passengers, "
                        + "{FuelLogs} fuel logs, {Maintenances} maintenances, {ServiceOrders} service orders, "
                        + "{Commissions} commissions.",
                    businessPartners.Count,
                    products.Count,
                    drivers.Count,
                    vehicles.Count,
                    quotes.Count,
                    orders.Count,
                    payments.Count,
                    tripLegs.Count,
                    passengers.Count,
                    fuelLogs.Count,
                    maintenances.Count,
                    serviceOrders.Count,
                    commissions.Count
                );
            }
            catch (Exception ex)
            {
                var logger2 = services.GetService<ILoggerFactory>()?.CreateLogger("DemoDataSeeder");
                logger2?.LogError(ex, "DemoDataSeeder: an error occurred while seeding demo data.");
            }
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
                        DocumentType = "CPF",
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
                        DocumentType = "CNPJ",
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
                        Type = AddressType.Home,
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

                quote.Price = price;
                quote.TotalPrice = total;
                quote.Discount = price - total;
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
            List<Driver> drivers,
            List<Vehicle> vehicles,
            List<Quote> convertedQuotes,
            DateTime now,
            out List<Transaction> transactions,
            out List<Order> fretamentoOrders
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

            var orders = new List<Order>();
            transactions = new List<Transaction>();
            fretamentoOrders = new List<Order>();

            var activeDrivers = drivers.Where(d => d.Status == DriverStatus.Active).ToList();
            var availableVehicles = vehicles.Where(v => v.Status != VehicleStatus.Blocked).ToList();

            const int totalOrders = 22;
            const int fretamentoCount = 12;

            for (var i = 0; i < totalOrders; i++)
            {
                var client = faker.PickRandom(clients);
                var orderDate = now.AddDays(-faker.Random.Number(0, 150));
                var isFretamento = i < fretamentoCount;
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
                    Description = isFretamento
                        ? "Fretamento eventual sob demanda."
                        : "Pedido de venda de produtos/serviços.",
                    BusinessPartnerId = client.Id,
                    TransactionId = transaction.Id,
                };

                if (isFretamento)
                {
                    order.Route = faker.PickRandom(routes);
                    order.DistanceKm = faker.Random.Decimal(80, 420);
                    order.DailyCount = faker.Random.Number(1, 3);
                    order.TransportLicenseNumber = faker.Random.Replace("ANTT-#######");
                    order.TransportLicenseExpiryDate = now.AddMonths(faker.Random.Number(2, 24));

                    if (activeDrivers.Count > 0)
                    {
                        order.DriverId = faker.PickRandom(activeDrivers).Id;
                    }
                    if (availableVehicles.Count > 0)
                    {
                        order.VehicleId = faker.PickRandom(availableVehicles).Id;
                    }
                }

                orders.Add(order);
                if (isFretamento)
                {
                    fretamentoOrders.Add(order);
                }
            }

            return orders;
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
                    var lineStart = order.Date;
                    var lineEnd = order.Date.AddDays(faker.Random.Number(0, order.DailyCount > 0 ? order.DailyCount : 3));

                    result.Add(
                        new OrderProduct
                        {
                            Id = Guid.NewGuid(),
                            Description = product.Name,
                            Quantity = quantity,
                            Discount = discount,
                            Price = product.Price * quantity,
                            StartDate = lineStart,
                            EndDate = lineEnd,
                            Status = OrderProductStatus.InProgress,
                            OrderId = order.Id,
                            ProductId = product.Id,
                        }
                    );

                    price += product.Price * quantity;
                    total += product.Price * quantity * (1 - discount / 100m);
                }

                order.Price = price;
                order.TotalPrice = total;
                order.Discount = price - total;
            }

            return result;
        }

        private static List<Payment> BuildPayments(Faker faker, List<Order> orders, DateTime now)
        {
            var result = new List<Payment>();

            foreach (var order in orders)
            {
                var installments = faker.Random.Number(1, 3);
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

        #endregion

        #region TripLeg / Passenger / FuelLog / VehicleMaintenance

        private static List<TripLeg> BuildTripLegs(Faker faker, List<Order> fretamentoOrders)
        {
            var result = new List<TripLeg>();

            foreach (var order in fretamentoOrders)
            {
                var legCount = faker.Random.Number(1, 2);
                var parts = (order.Route ?? "Origem → Destino").Split('→');
                var origin = parts.Length > 0 ? parts[0].Trim() : "Garagem";
                var destination = parts.Length > 1 ? parts[1].Trim() : "Destino";

                for (var n = 1; n <= legCount; n++)
                {
                    var departure = order.Date.AddDays(n - 1).AddHours(faker.Random.Number(5, 9));

                    result.Add(
                        new TripLeg
                        {
                            Id = Guid.NewGuid(),
                            SequenceNumber = n,
                            Origin = n == 1 ? origin : destination,
                            Destination = n == 1 ? destination : origin,
                            DepartureDate = departure,
                            ArrivalDate = departure.AddHours(faker.Random.Number(2, 6)),
                            DistanceKm = order.DistanceKm > 0 ? order.DistanceKm / legCount : faker.Random.Decimal(50, 200),
                            Notes = string.Empty,
                            OrderId = order.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<Passenger> BuildPassengers(Faker faker, List<Order> fretamentoOrders)
        {
            var result = new List<Passenger>();

            foreach (var order in fretamentoOrders)
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
                            OrderId = order.Id,
                        }
                    );
                }
            }

            return result;
        }

        private static List<FuelLog> BuildFuelLogs(Faker faker, List<Vehicle> vehicles, DateTime now)
        {
            var result = new List<FuelLog>();

            foreach (var vehicle in vehicles)
            {
                var entries = faker.Random.Number(1, 3);

                for (var n = 0; n < entries; n++)
                {
                    var liters = faker.Random.Decimal(120, 400);
                    var pricePerLiter = faker.Random.Decimal(5.8m, 6.6m);

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
                            VehicleId = vehicle.Id,
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
            DateTime now
        )
        {
            var result = new List<VehicleMaintenance>();

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

                    result.Add(
                        new VehicleMaintenance
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
                            ProductId = part?.Id,
                            PartQuantity = partQuantity,
                        }
                    );
                }
            }

            return result;
        }

        #endregion

        #region ServiceOrder / Commission

        private static List<ServiceOrder> BuildServiceOrders(List<Order> fretamentoOrders, DateTime now)
        {
            var result = new List<ServiceOrder>();
            var withDriver = fretamentoOrders.Where(o => o.DriverId.HasValue).ToList();

            for (var i = 0; i < withDriver.Count; i++)
            {
                var order = withDriver[i];
                var completed = order.Status == OrderStatus.Closed;

                result.Add(
                    new ServiceOrder
                    {
                        Id = Guid.NewGuid(),
                        Number = $"OS-{i + 1:D5}",
                        IssueDate = order.Date,
                        CompletionDate = completed ? order.Date.AddDays(order.DailyCount > 0 ? order.DailyCount : 1) : null,
                        Description = $"OS gerada para o pedido {order.OrderNumber}.",
                        Status = completed ? ServiceOrderStatus.Completed : ServiceOrderStatus.Open,
                        OrderId = order.Id,
                        DriverId = order.DriverId!.Value,
                        VehicleId = order.VehicleId,
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
