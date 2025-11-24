using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Product : BaseModel
    {
        public int Id { get; set; }

        public string Sku { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public decimal Price { get; set; }

        public ProductUnit Unit { get; set; }

        public int QuantityInStock { get; set; }
    }
}
