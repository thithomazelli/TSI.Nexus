using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Friday.Contracts.Models
{
    public class ProductPhoto : BaseModel
    {
        public int Id { get; set; }

        public string FileName { get; set; }

        public bool IsDefault { get; set; }

        [ForeignKey("Product")]
        public int ProductId { get; set; }

        public Product Product { get; set; }
    }
}
