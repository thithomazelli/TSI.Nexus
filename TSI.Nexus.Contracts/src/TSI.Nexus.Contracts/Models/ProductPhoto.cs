using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class ProductPhoto : BaseModel
    {
        public string FileName { get; set; }

        public bool IsDefault { get; set; }

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        public Product Product { get; set; }
    }
}
