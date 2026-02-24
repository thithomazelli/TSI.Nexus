using System.Collections.Generic;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Product : BaseModel
    {
        public string Sku { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public string Photo { get; set; }

        public decimal Price { get; set; }

        public ProductUnit Unit { get; set; }

        public ProductType Type { get; set; }

        public int QuantityInStock { get; set; }

        public ICollection<ProductPhoto> ProductPhotos { get; set; }
    }
}
