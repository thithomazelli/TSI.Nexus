namespace TSI.Friday.Contracts.Models.DTOs
{
    public class OrderProductDto
    {
        public int Id { get; set; }

        public string Description { get; set; }

        public decimal Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal Discount { get; set; }

        public decimal TotalPrice { get; set; }

        public int OrderId { get; set; }

        public int ProductId { get; set; }

        public string ProductName { get; set; }

        public string OrderNumber { get; set; }
    }
}
