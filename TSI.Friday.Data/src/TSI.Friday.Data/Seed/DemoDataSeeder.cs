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
    /// products, quotes, orders, payments, etc.) so the application can be presented without
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

                // ---- Phase 3: Products ----
                var products = BuildProducts();
                await context.Product.AddRangeAsync(products);
                await context.SaveChangesAsync();

                var clients = businessPartners.Where(bp => bp.Type == BusinessPartnerType.Client).ToList();

                // ---- Phase 4: Quotes + QuoteProducts ----
                var quotes = BuildQuotes(faker, clients, now, out var quoteProducts, products);
                await context.Quote.AddRangeAsync(quotes);
                await context.QuoteProduct.AddRangeAsync(quoteProducts);
                await context.SaveChangesAsync();

                // ---- Phase 5: Orders + Transactions ----
                var convertedQuotes = quotes.Where(q => q.Status == QuoteStatus.Converted).ToList();
                var orders = BuildOrders(faker, clients, convertedQuotes, now, out var transactions);
                await context.Transaction.AddRangeAsync(transactions);
                await context.Order.AddRangeAsync(orders);
                await context.SaveChangesAsync();

                // ---- Phase 6: OrderProducts (stock is adjusted for Sale/Rental products here) ----
                var orderProducts = BuildOrderProducts(faker, orders, products);
                await context.OrderProduct.AddRangeAsync(orderProducts);
                await context.SaveChangesAsync();

                // ---- Phase 7: Payments ----
                var payments = BuildPayments(faker, orders, now);
                await context.Payment.AddRangeAsync(payments);
                await context.SaveChangesAsync();

                // ---- Phase 8: Sequences - continue right after the numbers used above ----
                await EnsureSequenceAsync(context, "OrderNumberSeq", orders.Count + 1);
                await EnsureSequenceAsync(context, "QuoteNumberSeq", quotes.Count + 1);
                await context.SaveChangesAsync();

                logger?.LogInformation(
                    "DemoDataSeeder: seeded {BusinessPartners} business partners, {Products} products, "
                        + "{Quotes} quotes, {Orders} orders, {Payments} payments.",
                    businessPartners.Count,
                    products.Count,
                    quotes.Count,
                    orders.Count,
                    payments.Count
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
                var isSupplier = i >= 13; // last 2 individuals are suppliers

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
                var isSupplier = i >= 7; // last 3 companies are suppliers

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

        #region Product

        private static List<Product> BuildProducts()
        {
            // (Name, Category, Type, Price, Stock)
            var catalog = new (string Name, string Category, ProductType Type, decimal Price, int Stock)[]
            {
                ("Locação de Caçamba 3m³ - Diária", "Locação", ProductType.Rental, 180m, 999),
                ("Locação de Caçamba 5m³ - Diária", "Locação", ProductType.Rental, 220m, 999),
                ("Locação de Caçamba 5m³ - Semanal", "Locação", ProductType.Rental, 650m, 999),
                ("Locação de Caçamba 10m³ - Diária", "Locação", ProductType.Rental, 320m, 999),
                ("Locação de Container Estacionário 20m³", "Locação", ProductType.Rental, 980m, 999),
                ("Locação de Container Estacionário 30m³", "Locação", ProductType.Rental, 1350m, 999),
                ("Taxa de Transporte e Posicionamento", "Serviços", ProductType.Service, 90m, 999),
                ("Coleta e Descarte de Entulho", "Serviços", ProductType.Service, 250m, 999),
                ("Triagem e Reciclagem de Resíduos", "Serviços", ProductType.Service, 180m, 999),
                ("Serviço de Limpeza Pós-Obra", "Serviços", ProductType.Service, 420m, 999),
                ("Taxa de Licenciamento Ambiental", "Serviços", ProductType.Service, 150m, 999),
                ("Consultoria - Plano de Gerenciamento de Resíduos", "Serviços", ProductType.Service, 600m, 999),
                ("Big Bag para Entulho - Unidade", "Materiais", ProductType.Sale, 35m, 200),
                ("Lona de Cobertura para Caçamba", "Materiais", ProductType.Sale, 55m, 120),
                ("Cadeado de Segurança para Caçamba", "Materiais", ProductType.Sale, 28m, 150),
                ("Sinalização e Cones (Kit)", "Materiais", ProductType.Sale, 90m, 80),
                ("Placa de Identificação da Caçamba", "Materiais", ProductType.Sale, 45m, 100),
                ("Locação de Caçamba 3m³ - Mensal", "Locação", ProductType.Rental, 480m, 999),
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

        #endregion

        #region Quote / QuoteProduct

        private static List<Quote> BuildQuotes(
            Faker faker,
            List<BusinessPartner> clients,
            DateTime now,
            out List<QuoteProduct> quoteProducts,
            List<Product> products
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
                    Description = "Orçamento de prestação de serviços.",
                    BusinessPartnerId = client.Id,
                    Condition = faker.PickRandom(PaymentCondition.FullPayment, PaymentCondition.InInstallments),
                    Method = faker.PickRandom(
                        PaymentMethod.Cash,
                        PaymentMethod.Pix,
                        PaymentMethod.CreditCard,
                        PaymentMethod.DebitCard
                    ),
                };

                var items = faker.PickRandom(products, faker.Random.Number(1, 3)).ToList();
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
            List<Quote> convertedQuotes,
            DateTime now,
            out List<Transaction> transactions
        )
        {
            var orders = new List<Order>();
            transactions = new List<Transaction>();

            const int totalOrders = 22;

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

        private static List<OrderProduct> BuildOrderProducts(Faker faker, List<Order> orders, List<Product> products)
        {
            var result = new List<OrderProduct>();

            foreach (var order in orders)
            {
                var items = faker.PickRandom(products, faker.Random.Number(1, 3)).ToList();
                decimal price = 0m;
                decimal total = 0m;

                foreach (var product in items)
                {
                    var quantity = faker.Random.Number(1, 3);
                    var discount = faker.Random.Number(0, 10);
                    var lineStart = order.Date;
                    var lineEnd = order.Date.AddDays(faker.Random.Number(1, 7));

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
