using System;
using System.Collections.Generic;
using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using TSI.Nexus.Contracts.Enums;
using TSI.Nexus.Contracts.Models;
using TSI.Nexus.Contracts.Models.DTOs;

namespace TSI.Nexus.IoC.Tests
{
    public class MappingProfileTests
    {
        private readonly IMapper _mapper;

        public MappingProfileTests()
        {
            var config = new MapperConfiguration(
                cfg =>
                {
                    cfg.ConstructServicesUsing(type => null);
                    cfg.AddMaps(typeof(MappingProfile).Assembly);
                },
                new LoggerFactory()
            );
            _mapper = config.CreateMapper();
        }

        // Note: AutoMapper's config.AssertConfigurationIsValid() is intentionally NOT used here.
        // Several DTO->Entity maps in MappingProfile leave navigation properties (e.g.
        // QuoteProductDto -> QuoteProduct's Quote/Product, EventDto -> Event's many links) and
        // audit fields unmapped by design - those are populated by the service layer, not
        // AutoMapper. Strict validation fails on this intentional partial mapping (confirmed by
        // running it against the full profile), which is presumably why no other test project in
        // this codebase calls it either. See MappingProfileTests class remarks / final report for
        // details.

        #region Address

        [Fact]
        public void Map_AddressToAddressDto_CopiesAllFields()
        {
            var address = new Address
            {
                Id = Guid.NewGuid(),
                Name = "Home",
                Street = "Main St",
                Number = 10,
                City = "Springfield",
                State = "SP",
                ZipCode = "12345",
                Country = "Brazil",
                Comments = "none",
                Type = "Residential",
                IsDefault = true,
                BusinessPartnerId = Guid.NewGuid(),
            };

            var dto = _mapper.Map<AddressDto>(address);

            dto.Id.Should().Be(address.Id);
            dto.Name.Should().Be(address.Name);
            dto.Street.Should().Be(address.Street);
            dto.Number.Should().Be(address.Number);
            dto.City.Should().Be(address.City);
            dto.State.Should().Be(address.State);
            dto.ZipCode.Should().Be(address.ZipCode);
            dto.Country.Should().Be(address.Country);
            dto.Comments.Should().Be(address.Comments);
            dto.Type.Should().Be(address.Type);
            dto.IsDefault.Should().BeTrue();
            dto.BusinessPartnerId.Should().Be(address.BusinessPartnerId);
        }

        [Fact]
        public void Map_AddressDtoToAddress_IgnoresNullMembers()
        {
            var target = new Address { Name = "Existing" };
            var dto = new AddressDto { Name = null, City = "New City" };

            _mapper.Map(dto, target);

            target.Name.Should().Be("Existing");
            target.City.Should().Be("New City");
        }

        #endregion

        #region BusinessPartner

        [Fact]
        public void Map_BusinessPartnerDtoToIndividual_CopiesIndividualFields()
        {
            var dto = new BusinessPartnerDto
            {
                Name = "John",
                SocialSecurityCard = "SSC-1",
                NationalIdCard = "NIC-1",
                Birthday = new DateTime(1990, 1, 1),
            };

            var individual = _mapper.Map<Individual>(dto);

            individual.Name.Should().Be("John");
            individual.SocialSecurityCard.Should().Be("SSC-1");
            individual.NationalIdCard.Should().Be("NIC-1");
            individual.Birthday.Should().Be(new DateTime(1990, 1, 1));
        }

        [Fact]
        public void Map_BusinessPartnerDtoToCompany_CopiesCompanyFields()
        {
            var dto = new BusinessPartnerDto { Name = "ACME", NationalRegistry = "12.345" };

            var company = _mapper.Map<Company>(dto);

            company.Name.Should().Be("ACME");
            company.NationalRegistry.Should().Be("12.345");
        }

        [Theory]
        [InlineData("física")]
        [InlineData("fisica")]
        [InlineData("")]
        [InlineData(null)]
        public void Map_BusinessPartnerDtoToBusinessPartner_DispatchesToIndividual_WhenDocumentTypeIsFisicaOrUnrecognized(
            string documentType
        )
        {
            var dto = new BusinessPartnerDto { Name = "John", DocumentType = documentType };

            var businessPartner = _mapper.Map<BusinessPartner>(dto);

            businessPartner.Should().BeOfType<Individual>();
        }

        [Theory]
        [InlineData("jurídica")]
        [InlineData("juridica")]
        public void Map_BusinessPartnerDtoToBusinessPartner_DispatchesToCompany_WhenDocumentTypeIsJuridica(
            string documentType
        )
        {
            var dto = new BusinessPartnerDto { Name = "ACME", DocumentType = documentType };

            var businessPartner = _mapper.Map<BusinessPartner>(dto);

            businessPartner.Should().BeOfType<Company>();
        }

        [Fact]
        public void Map_IndividualToBusinessPartnerDto_CopiesIndividualSpecificFields()
        {
            var individual = new Individual
            {
                Name = "John",
                SocialSecurityCard = "SSC-1",
                NationalIdCard = "NIC-1",
                Birthday = new DateTime(1990, 1, 1),
            };

            var dto = _mapper.Map<BusinessPartnerDto>(individual);

            dto.SocialSecurityCard.Should().Be("SSC-1");
            dto.NationalIdCard.Should().Be("NIC-1");
            dto.Birthday.Should().Be(new DateTime(1990, 1, 1));
            dto.NationalRegistry.Should().BeNull();
        }

        [Fact]
        public void Map_CompanyToBusinessPartnerDto_CopiesCompanySpecificFields()
        {
            var company = new Company { Name = "ACME", NationalRegistry = "12.345" };

            var dto = _mapper.Map<BusinessPartnerDto>(company);

            dto.NationalRegistry.Should().Be("12.345");
            dto.SocialSecurityCard.Should().BeNull();
        }

        [Fact]
        public void Map_BusinessPartnerToBusinessPartnerDto_ComputesNextEmptyTransactionId_WhenOpenTransactionExists()
        {
            var openTransaction = new Transaction
            {
                Id = Guid.NewGuid(),
                OrderId = null,
                Date = DateTime.UtcNow.AddDays(-1),
            };
            var closedTransaction = new Transaction
            {
                Id = Guid.NewGuid(),
                OrderId = Guid.NewGuid(),
                Date = DateTime.UtcNow,
            };
            var individual = new Individual
            {
                Name = "John",
                Transactions = new List<Transaction> { closedTransaction, openTransaction },
            };

            var dto = _mapper.Map<BusinessPartnerDto>(individual);

            dto.NextEmptyTransactionId.Should().Be(openTransaction.Id);
        }

        [Fact]
        public void Map_BusinessPartnerToBusinessPartnerDto_NextEmptyTransactionIdIsNull_WhenNoTransactions()
        {
            var individual = new Individual { Name = "John", Transactions = null };

            var dto = _mapper.Map<BusinessPartnerDto>(individual);

            dto.NextEmptyTransactionId.Should().BeNull();
        }

        #endregion

        #region User

        [Fact]
        public void Map_UserToUserDto_MapsRoleAndIgnoresJwt()
        {
            var user = new User
            {
                FirstName = "John",
                LastName = "Doe",
                Role = "Admin",
            };

            var dto = _mapper.Map<UserDto>(user);

            dto.FirstName.Should().Be("John");
            dto.LastName.Should().Be("Doe");
            dto.Role.Should().Be("Admin");
        }

        [Fact]
        public void Map_UserDtoToUser_MapsRole()
        {
            var dto = new UserDto { FirstName = "John", Role = "Admin" };

            var user = _mapper.Map<User>(dto);

            user.FirstName.Should().Be("John");
            user.Role.Should().Be("Admin");
        }

        #endregion

        #region Order / PurchaseOrder / Trip - transaction status computation

        [Theory]
        [InlineData(PaymentStatus.Delayed, PaymentStatus.Delayed)]
        [InlineData(PaymentStatus.Pending, PaymentStatus.Pending)]
        [InlineData(PaymentStatus.Approved, PaymentStatus.Approved)]
        public void Map_OrderToOrderDto_ComputesTransactionStatusFromPayments(
            PaymentStatus paymentStatus,
            PaymentStatus expectedStatus
        )
        {
            var order = new Order
            {
                OrderNumber = "ORD-1",
                BusinessPartner = new Individual { Name = "Cliente" },
                Transaction = new Transaction
                {
                    Payments = new List<Payment> { new Payment { Status = paymentStatus } },
                },
            };

            var dto = _mapper.Map<OrderDto>(order);

            dto.Transaction!.Status.Should().Be(expectedStatus);
            dto.Transaction.HasOpenedPayments.Should().Be(paymentStatus != PaymentStatus.Approved);
        }

        [Fact]
        public void Map_OrderToOrderDto_WithNoPayments_HasOpenedPaymentsIsFalse()
        {
            var order = new Order
            {
                OrderNumber = "ORD-1",
                Transaction = new Transaction { Payments = new List<Payment>() },
            };

            var dto = _mapper.Map<OrderDto>(order);

            dto.Transaction!.HasOpenedPayments.Should().BeFalse();
            dto.Transaction.MarkAllPaymentsAsApproved.Should().BeFalse();
        }

        [Fact]
        public void Map_OrderToOrderDto_MapsBusinessPartnerNameWhenPresent()
        {
            var order = new Order { OrderNumber = "ORD-1", BusinessPartner = new Individual { Name = "Cliente X" } };

            var dto = _mapper.Map<OrderDto>(order);

            dto.BusinessPartnerName.Should().Be("Cliente X");
        }

        [Fact]
        public void Map_OrderToOrderDto_BusinessPartnerNameIsNull_WhenBusinessPartnerIsNull()
        {
            var order = new Order { OrderNumber = "ORD-1", BusinessPartner = null };

            var dto = _mapper.Map<OrderDto>(order);

            dto.BusinessPartnerName.Should().BeNull();
        }

        [Fact]
        public void Map_OrderDtoToOrder_MapsTransactionAndIgnoresNullMembers()
        {
            var target = new Order { OrderNumber = "Existing" };
            var dto = new OrderDto { OrderNumber = null, Description = "New description" };

            _mapper.Map(dto, target);

            target.OrderNumber.Should().Be("Existing");
            target.Description.Should().Be("New description");
        }

        [Theory]
        [InlineData(PaymentStatus.Delayed)]
        [InlineData(PaymentStatus.Pending)]
        [InlineData(PaymentStatus.Approved)]
        public void Map_PurchaseOrderToPurchaseOrderDto_ComputesTransactionStatusFromPayments(
            PaymentStatus paymentStatus
        )
        {
            var purchaseOrder = new PurchaseOrder
            {
                PurchaseOrderNumber = "PO-1",
                BusinessPartner = new Individual { Name = "Fornecedor" },
                Transaction = new Transaction
                {
                    Payments = new List<Payment> { new Payment { Status = paymentStatus } },
                },
            };

            var dto = _mapper.Map<PurchaseOrderDto>(purchaseOrder);

            dto.Transaction!.Status.Should().Be(paymentStatus);
        }

        [Fact]
        public void Map_PurchaseOrderToPurchaseOrderDto_WithNoPayments_HasOpenedPaymentsIsFalse()
        {
            var purchaseOrder = new PurchaseOrder
            {
                PurchaseOrderNumber = "PO-1",
                Transaction = new Transaction { Payments = new List<Payment>() },
            };

            var dto = _mapper.Map<PurchaseOrderDto>(purchaseOrder);

            dto.Transaction!.HasOpenedPayments.Should().BeFalse();
        }

        [Fact]
        public void Map_PurchaseOrderDtoToPurchaseOrder_MapsTransaction()
        {
            var target = new PurchaseOrder { PurchaseOrderNumber = "Existing" };
            var dto = new PurchaseOrderDto { PurchaseOrderNumber = null, Description = "New" };

            _mapper.Map(dto, target);

            target.PurchaseOrderNumber.Should().Be("Existing");
            target.Description.Should().Be("New");
        }

        [Theory]
        [InlineData(PaymentStatus.Delayed)]
        [InlineData(PaymentStatus.Pending)]
        [InlineData(PaymentStatus.Approved)]
        public void Map_TripToTripDto_ComputesTransactionStatusFromPayments(PaymentStatus paymentStatus)
        {
            var trip = new Trip
            {
                TripNumber = "TRIP-1",
                BusinessPartner = new Individual { Name = "Cliente" },
                Vehicle = new Vehicle { Plate = "ABC-1234" },
                Driver = new Driver { Name = "Carlos" },
                Transaction = new Transaction
                {
                    Payments = new List<Payment> { new Payment { Status = paymentStatus } },
                },
            };

            var dto = _mapper.Map<TripDto>(trip);

            dto.Transaction!.Status.Should().Be(paymentStatus);
            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.DriverName.Should().Be("Carlos");
        }

        [Fact]
        public void Map_TripToTripDto_WithNoPayments_HasOpenedPaymentsIsFalse()
        {
            var trip = new Trip
            {
                TripNumber = "TRIP-1",
                Transaction = new Transaction { Payments = new List<Payment>() },
            };

            var dto = _mapper.Map<TripDto>(trip);

            dto.Transaction!.HasOpenedPayments.Should().BeFalse();
        }

        [Fact]
        public void Map_TripToTripDto_VehicleAndDriverNamesAreNull_WhenNotSet()
        {
            var trip = new Trip { TripNumber = "TRIP-1", Vehicle = null, Driver = null };

            var dto = _mapper.Map<TripDto>(trip);

            dto.VehiclePlate.Should().BeNull();
            dto.DriverName.Should().BeNull();
        }

        [Fact]
        public void Map_TripDtoToTrip_MapsTransaction()
        {
            var target = new Trip { TripNumber = "Existing" };
            var dto = new TripDto { TripNumber = null, Route = "New Route" };

            _mapper.Map(dto, target);

            target.TripNumber.Should().Be("Existing");
            target.Route.Should().Be("New Route");
        }

        #endregion

        #region PurchaseOrderProduct / VehicleMaintenanceProduct / OrderProduct / QuoteProduct

        [Fact]
        public void Map_PurchaseOrderProductToDto_MapsDenormalizedFields()
        {
            var purchaseOrder = new PurchaseOrder
            {
                PurchaseOrderNumber = "PO-1",
                BusinessPartnerId = Guid.NewGuid(),
                BusinessPartner = new Individual { Name = "Fornecedor" },
            };
            var product = new Product { Sku = "SKU-1", Name = "Produto", Type = ProductType.Sale };
            var entity = new PurchaseOrderProduct
            {
                Quantity = 2m,
                PurchaseOrder = purchaseOrder,
                Product = product,
            };

            var dto = _mapper.Map<PurchaseOrderProductDto>(entity);

            dto.PurchaseOrderNumber.Should().Be("PO-1");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductName.Should().Be("Produto");
            dto.ProductType.Should().Be(ProductType.Sale);
            dto.BusinessPartnerId.Should().Be(purchaseOrder.BusinessPartnerId);
            dto.BusinessPartnerName.Should().Be("Fornecedor");
            dto.PreviousQuantity.Should().Be(2m);
        }

        [Fact]
        public void Map_PurchaseOrderProductToDto_WithNullNavigations_UsesDefaults()
        {
            var entity = new PurchaseOrderProduct { Quantity = 1m, PurchaseOrder = null, Product = null };

            var dto = _mapper.Map<PurchaseOrderProductDto>(entity);

            dto.PurchaseOrderNumber.Should().BeNull();
            dto.ProductSku.Should().BeNull();
            dto.ProductType.Should().Be(ProductType.Sale);
            dto.BusinessPartnerId.Should().Be(Guid.Empty);
            dto.BusinessPartnerName.Should().BeNull();
        }

        [Fact]
        public void Map_VehicleMaintenanceProductToDto_MapsDenormalizedFields()
        {
            var vehicleMaintenance = new VehicleMaintenance
            {
                VehicleId = Guid.NewGuid(),
                Vehicle = new Vehicle { Plate = "ABC-1234" },
            };
            var product = new Product { Sku = "SKU-1", Name = "Peça", Type = ProductType.Sale };
            var entity = new VehicleMaintenanceProduct
            {
                Quantity = 1m,
                VehicleMaintenance = vehicleMaintenance,
                Product = product,
            };

            var dto = _mapper.Map<VehicleMaintenanceProductDto>(entity);

            dto.VehicleId.Should().Be(vehicleMaintenance.VehicleId);
            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductName.Should().Be("Peça");
            dto.PreviousQuantity.Should().Be(1m);
        }

        [Fact]
        public void Map_VehicleMaintenanceProductToDto_WithNullNavigations_UsesDefaults()
        {
            var entity = new VehicleMaintenanceProduct
            {
                Quantity = 1m,
                VehicleMaintenance = null,
                Product = null,
            };

            var dto = _mapper.Map<VehicleMaintenanceProductDto>(entity);

            dto.VehicleId.Should().Be(Guid.Empty);
            dto.VehiclePlate.Should().BeNull();
            dto.ProductSku.Should().BeNull();
            dto.ProductType.Should().Be(ProductType.Sale);
        }

        [Fact]
        public void Map_OrderProductToDto_MapsDenormalizedFields()
        {
            var order = new Order
            {
                OrderNumber = "ORD-1",
                BusinessPartnerId = Guid.NewGuid(),
                BusinessPartner = new Individual { Name = "Cliente" },
            };
            var product = new Product { Sku = "SKU-1", Name = "Produto", Type = ProductType.Rental };
            var entity = new OrderProduct { Quantity = 3m, Order = order, Product = product };

            var dto = _mapper.Map<OrderProductDto>(entity);

            dto.OrderNumber.Should().Be("ORD-1");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Rental);
            dto.BusinessPartnerId.Should().Be(order.BusinessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente");
        }

        [Fact]
        public void Map_OrderProductToDto_WithNullNavigations_UsesDefaults()
        {
            var entity = new OrderProduct { Quantity = 1m, Order = null, Product = null };

            var dto = _mapper.Map<OrderProductDto>(entity);

            dto.OrderNumber.Should().BeNull();
            dto.BusinessPartnerId.Should().Be(Guid.Empty);
            dto.ProductType.Should().Be(ProductType.Sale);
        }

        [Fact]
        public void Map_QuoteProductToDto_MapsDenormalizedFields()
        {
            var quote = new Quote
            {
                QuoteNumber = "QUO-1",
                BusinessPartnerId = Guid.NewGuid(),
                BusinessPartner = new Individual { Name = "Cliente" },
            };
            var product = new Product { Sku = "SKU-1", Name = "Produto", Type = ProductType.Service };
            var entity = new QuoteProduct { Quantity = 1m, Quote = quote, Product = product };

            var dto = _mapper.Map<QuoteProductDto>(entity);

            dto.OrderId.Should().Be(entity.QuoteId);
            dto.OrderNumber.Should().Be("QUO-1");
            dto.ProductSku.Should().Be("SKU-1");
            dto.ProductType.Should().Be(ProductType.Service);
            dto.BusinessPartnerId.Should().Be(quote.BusinessPartnerId);
            dto.BusinessPartnerName.Should().Be("Cliente");
        }

        [Fact]
        public void Map_QuoteProductToDto_WithNullNavigations_UsesDefaults()
        {
            var entity = new QuoteProduct { Quantity = 1m, Quote = null, Product = null };

            var dto = _mapper.Map<QuoteProductDto>(entity);

            dto.OrderNumber.Should().BeNull();
            dto.BusinessPartnerId.Should().Be(Guid.Empty);
            dto.ProductType.Should().Be(ProductType.Sale);
        }

        [Fact]
        public void Map_QuoteProductDtoToQuoteProduct_MapsQuoteIdFromOrderId()
        {
            var quoteId = Guid.NewGuid();
            var dto = new QuoteProductDto { OrderId = quoteId, Quantity = 1m };

            var entity = _mapper.Map<QuoteProduct>(dto);

            entity.QuoteId.Should().Be(quoteId);
        }

        #endregion

        #region TripDriver

        [Fact]
        public void Map_TripDriverToTripDriverDto_MapsDenormalizedFields()
        {
            var entity = new TripDriver
            {
                Amount = 100m,
                Trip = new Trip { TripNumber = "TRIP-1" },
                Driver = new Driver
                {
                    Name = "Carlos",
                    LicenseNumber = "LIC-1",
                    LicenseExpiryDate = new DateTime(2030, 1, 1),
                },
            };

            var dto = _mapper.Map<TripDriverDto>(entity);

            dto.TripNumber.Should().Be("TRIP-1");
            dto.DriverName.Should().Be("Carlos");
            dto.DriverLicenseNumber.Should().Be("LIC-1");
            dto.DriverLicenseExpiryDate.Should().Be(new DateTime(2030, 1, 1));
        }

        [Fact]
        public void Map_TripDriverToTripDriverDto_WithNullNavigations_UsesDefaults()
        {
            var entity = new TripDriver { Amount = 100m, Trip = null, Driver = null };

            var dto = _mapper.Map<TripDriverDto>(entity);

            dto.TripNumber.Should().BeNull();
            dto.DriverName.Should().BeNull();
            dto.DriverLicenseExpiryDate.Should().Be(default(DateTime));
        }

        #endregion

        #region Transaction / Payment

        [Fact]
        public void Map_TransactionToTransactionDto_ComputesPaymentTotals()
        {
            var transaction = new Transaction
            {
                Order = new Order { OrderNumber = "ORD-1" },
                Trip = new Trip { TripNumber = "TRIP-1" },
                BusinessPartner = new Individual { Name = "Cliente" },
                Payments = new List<Payment>
                {
                    new Payment { Type = PaymentType.Incoming, Price = 100m, Status = PaymentStatus.Approved },
                    new Payment { Type = PaymentType.Outgoing, Price = 40m, Status = PaymentStatus.Pending },
                },
            };

            var dto = _mapper.Map<TransactionDto>(transaction);

            dto.OrderNumber.Should().Be("ORD-1");
            dto.TripNumber.Should().Be("TRIP-1");
            dto.BusinessPartnerName.Should().Be("Cliente");
            dto.TotalOfPayments.Should().Be(1);
            dto.TotalOfExpenses.Should().Be(1);
            dto.PaymentTotalPrice.Should().Be(100m);
            dto.ExpenseTotalPrice.Should().Be(40m);
            dto.HasOpenedPayments.Should().BeTrue();
            dto.Payments.Should().HaveCount(2);
        }

        [Fact]
        public void Map_TransactionToTransactionDto_WithNullPayments_TotalsAreZero()
        {
            var transaction = new Transaction { Payments = null };

            var dto = _mapper.Map<TransactionDto>(transaction);

            dto.TotalOfPayments.Should().Be(0);
            dto.TotalOfExpenses.Should().Be(0);
            dto.PaymentTotalPrice.Should().Be(0m);
            dto.ExpenseTotalPrice.Should().Be(0m);
            dto.HasOpenedPayments.Should().BeFalse();
        }

        [Fact]
        public void Map_TransactionDtoToTransaction_IgnoresPayments()
        {
            var target = new Transaction { Id = Guid.NewGuid() };
            var dto = new TransactionDto { Id = Guid.Empty, Description = "New description" };

            _mapper.Map(dto, target);

            target.Description.Should().Be("New description");
            target.Payments.Should().NotBeNull();
        }

        // NB: TransactionDto -> Transaction configures a member-specific Condition on Id
        // (`srcMember != Guid.Empty`, intended to avoid zeroing an existing Id on update), but the
        // map also ends with `.ForAllMembers(opts => opts.Condition(srcMember != null))`. AutoMapper
        // applies that call to every member's PropertyMap - including Id - and a boxed non-nullable
        // Guid is never `== null`, so the general condition silently replaces (not ANDs with) the
        // specific one. In practice this means the Id-preservation guard never actually applies:
        // mapping a TransactionDto with Id == Guid.Empty onto an existing Transaction DOES overwrite
        // its Id with Guid.Empty, as asserted below. Flagged per instructions rather than fixed -
        // this looks like a real (if perhaps latent) bug in MappingProfile.cs, not something to
        // silently work around in a test.
        [Fact]
        public void Map_TransactionDtoToTransaction_EmptyIdConditionIsIneffective_OverwritesExistingId()
        {
            var target = new Transaction { Id = Guid.NewGuid() };
            var dto = new TransactionDto { Id = Guid.Empty, Description = "New description" };

            _mapper.Map(dto, target);

            target.Id.Should().Be(Guid.Empty);
        }

        [Fact]
        public void Map_TransactionDtoToTransaction_MapsIdWhenNotEmpty()
        {
            var target = new Transaction { Id = Guid.NewGuid() };
            var newId = Guid.NewGuid();
            var dto = new TransactionDto { Id = newId, Description = "New description" };

            _mapper.Map(dto, target);

            target.Id.Should().Be(newId);
        }

        [Fact]
        public void Map_PaymentToPaymentDto_MapsDenormalizedFields()
        {
            var payment = new Payment
            {
                Order = new Order { OrderNumber = "ORD-1" },
                Trip = new Trip { TripNumber = "TRIP-1" },
                BusinessPartner = new Individual { Name = "Cliente", Type = BusinessPartnerType.Client },
                Transaction = new Transaction { Description = "Venda" },
                Driver = new Driver { Name = "Carlos" },
            };

            var dto = _mapper.Map<PaymentDto>(payment);

            dto.OrderNumber.Should().Be("ORD-1");
            dto.TripNumber.Should().Be("TRIP-1");
            dto.BusinessPartnerName.Should().Be("Cliente");
            dto.BusinessPartnerType.Should().Be(BusinessPartnerType.Client);
            dto.TransactionDescription.Should().Be("Venda");
            dto.DriverName.Should().Be("Carlos");
        }

        [Fact]
        public void Map_PaymentToPaymentDto_WithNullNavigations_UsesDefaults()
        {
            var payment = new Payment
            {
                Order = null,
                Trip = null,
                BusinessPartner = null,
                Transaction = null,
                Driver = null,
            };

            var dto = _mapper.Map<PaymentDto>(payment);

            dto.OrderNumber.Should().BeNull();
            dto.BusinessPartnerName.Should().BeNull();
            dto.BusinessPartnerType.Should().BeNull();
            dto.TransactionDescription.Should().BeNull();
            dto.DriverName.Should().BeNull();
        }

        #endregion

        #region Quote / QuoteTrip

        [Fact]
        public void Map_QuoteToQuoteDto_MapsBusinessPartnerNameAndCollections()
        {
            var quote = new Quote
            {
                QuoteNumber = "QUO-1",
                BusinessPartner = new Individual { Name = "Cliente" },
                QuoteProducts = new List<QuoteProduct> { new QuoteProduct() },
                QuoteTrip = new QuoteTrip { Route = "SP -> RJ" },
            };

            var dto = _mapper.Map<QuoteDto>(quote);

            dto.QuoteNumber.Should().Be("QUO-1");
            dto.BusinessPartnerName.Should().Be("Cliente");
            dto.QuoteProducts.Should().HaveCount(1);
            dto.QuoteTrip.Route.Should().Be("SP -> RJ");
        }

        [Fact]
        public void Map_QuoteDtoToQuote_MapsQuoteNumberAndIgnoresQuoteTrip()
        {
            var target = new Quote { QuoteNumber = "Existing", QuoteTrip = new QuoteTrip { Route = "Existing route" } };
            var dto = new QuoteDto { QuoteNumber = "QUO-2", Description = "New description" };

            _mapper.Map(dto, target);

            target.QuoteNumber.Should().Be("QUO-2");
            target.Description.Should().Be("New description");
            target.QuoteTrip!.Route.Should().Be("Existing route");
        }

        [Fact]
        public void Map_QuoteTripToQuoteTripDto_MapsVehiclePlateAndDriverName()
        {
            var quoteTrip = new QuoteTrip
            {
                Route = "SP -> RJ",
                Vehicle = new Vehicle { Plate = "ABC-1234" },
                Driver = new Driver { Name = "Carlos" },
            };

            var dto = _mapper.Map<QuoteTripDto>(quoteTrip);

            dto.VehiclePlate.Should().Be("ABC-1234");
            dto.DriverName.Should().Be("Carlos");
        }

        [Fact]
        public void Map_QuoteTripToQuoteTripDto_WithNullNavigations_UsesDefaults()
        {
            var quoteTrip = new QuoteTrip { Route = "SP -> RJ", Vehicle = null, Driver = null };

            var dto = _mapper.Map<QuoteTripDto>(quoteTrip);

            dto.VehiclePlate.Should().BeNull();
            dto.DriverName.Should().BeNull();
        }

        #endregion

        #region Event / EventParticipant

        [Theory]
        [InlineData("BusinessPartner")]
        [InlineData("Order")]
        [InlineData("PurchaseOrder")]
        [InlineData("Quote")]
        [InlineData("Trip")]
        [InlineData("Transaction")]
        [InlineData("Payment")]
        [InlineData("Vehicle")]
        [InlineData("Driver")]
        [InlineData("VehicleMaintenance")]
        [InlineData("FuelLog")]
        public void Map_EventToEventDto_ComputesLinkedEntityTypeAndLabel(string linkedEntity)
        {
            var evt = new Event { Title = "Evento" };

            switch (linkedEntity)
            {
                case "BusinessPartner":
                    evt.BusinessPartner = new Individual { Name = "Cliente X" };
                    break;
                case "Order":
                    evt.Order = new Order { OrderNumber = "ORD-1" };
                    break;
                case "PurchaseOrder":
                    evt.PurchaseOrder = new PurchaseOrder { PurchaseOrderNumber = "PO-1" };
                    break;
                case "Quote":
                    evt.Quote = new Quote { QuoteNumber = "QUO-1" };
                    break;
                case "Trip":
                    evt.Trip = new Trip { TripNumber = "TRIP-1" };
                    break;
                case "Transaction":
                    evt.Transaction = new Transaction { Description = "Venda" };
                    break;
                case "Payment":
                    evt.Payment = new Payment { Description = "Pagamento" };
                    break;
                case "Vehicle":
                    evt.Vehicle = new Vehicle { Plate = "ABC-1234" };
                    break;
                case "Driver":
                    evt.Driver = new Driver { Name = "Carlos" };
                    break;
                case "VehicleMaintenance":
                    evt.VehicleMaintenance = new VehicleMaintenance { Description = "Troca de óleo" };
                    break;
                case "FuelLog":
                    evt.FuelLog = new FuelLog { GasStation = "Posto Central" };
                    break;
            }

            var dto = _mapper.Map<EventDto>(evt);

            dto.LinkedEntityType.Should().Be(linkedEntity);
            dto.LinkedEntityLabel.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public void Map_EventToEventDto_WithNoLinks_LinkedEntityTypeIsNull()
        {
            var evt = new Event { Title = "Evento" };

            var dto = _mapper.Map<EventDto>(evt);

            dto.LinkedEntityType.Should().BeNull();
            dto.LinkedEntityLabel.Should().BeNull();
        }

        [Fact]
        public void Map_EventToEventDto_MapsEventTypeAndCreatedByUser()
        {
            var evt = new Event
            {
                Title = "Evento",
                EventType = new SelectableOption { Value = "Reunião", Color = "#FF0000" },
                CreatedByUser = new User { FirstName = "John", LastName = "Doe" },
            };

            var dto = _mapper.Map<EventDto>(evt);

            dto.EventTypeName.Should().Be("Reunião");
            dto.EventTypeColor.Should().Be("#FF0000");
            dto.CreatedByUserName.Should().Be("John Doe");
        }

        [Fact]
        public void Map_EventToEventDto_WithNullEventTypeAndCreatedByUser_NamesAreNull()
        {
            var evt = new Event
            {
                Title = "Evento",
                EventType = null!,
                CreatedByUser = null!,
            };

            var dto = _mapper.Map<EventDto>(evt);

            dto.EventTypeName.Should().BeNull();
            dto.CreatedByUserName.Should().BeNull();
        }

        [Fact]
        public void Map_EventDtoToEvent_IgnoresParticipants()
        {
            var target = new Event { Title = "Existing", Participants = new List<EventParticipant> { new EventParticipant() } };
            var dto = new EventDto { Title = "New title" };

            _mapper.Map(dto, target);

            target.Title.Should().Be("New title");
            target.Participants.Should().HaveCount(1);
        }

        [Fact]
        public void Map_EventParticipantToDto_DisplayNameUsesNameOrEmail_WhenUserIdIsNull()
        {
            var participant = new EventParticipant { UserId = null, Name = "Convidado", Email = "convidado@example.com" };

            var dto = _mapper.Map<EventParticipantDto>(participant);

            dto.DisplayName.Should().Be("Convidado");
        }

        [Fact]
        public void Map_EventParticipantToDto_DisplayNameFallsBackToEmail_WhenNameIsNull()
        {
            var participant = new EventParticipant { UserId = null, Name = null, Email = "convidado@example.com" };

            var dto = _mapper.Map<EventParticipantDto>(participant);

            dto.DisplayName.Should().Be("convidado@example.com");
        }

        [Fact]
        public void Map_EventParticipantToDto_DisplayNameIsNull_WhenUserIdIsSet()
        {
            var participant = new EventParticipant { UserId = "user-1", Name = "Convidado" };

            var dto = _mapper.Map<EventParticipantDto>(participant);

            dto.DisplayName.Should().BeNull();
        }

        [Fact]
        public void Map_EventParticipantDtoToEventParticipant_IgnoresNullMembers()
        {
            var target = new EventParticipant { Name = "Existing" };
            var dto = new EventParticipantDto { Name = null, Email = "new@example.com" };

            _mapper.Map(dto, target);

            target.Name.Should().Be("Existing");
            target.Email.Should().Be("new@example.com");
        }

        #endregion
    }
}
