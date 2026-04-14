using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models.DTOs
{
    public class QuoteDto
    {
        public Guid Id { get; set; }

        public string OrderNumber { get; set; }

        public DateTime Date { get; set; }

        public Guid BusinessPartnerId { get; set; }

        public string BusinessPartnerName { get; set; }

        public OrderStatus Status { get; set; }

        public DateTime CreateDate { get; set; }

        public string Description { get; set; }

        public decimal Discount { get; set; }

        public decimal Price { get; set; }

        public decimal TotalPrice { get; set; }

        public ICollection<QuoteProductDto> QuoteProducts { get; set; } = [];
    }
}
