using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TSI.Nexus.Contracts.Models
{
    public class VehicleMaintenanceProduct : BaseModel
    {
        public string Description { get; set; } = string.Empty;

        public decimal Quantity { get; set; }

        public decimal Price { get; set; }

        public decimal Discount { get; set; }

        [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
        public decimal TotalPrice { get; private set; }

        [ForeignKey("VehicleMaintenance")]
        public Guid VehicleMaintenanceId { get; set; }

        [Required]
        public virtual VehicleMaintenance VehicleMaintenance { get; set; } = null!;

        [ForeignKey("Product")]
        public Guid ProductId { get; set; }

        [Required]
        public virtual Product Product { get; set; } = null!;

        public VehicleMaintenanceProduct() { }

        public VehicleMaintenanceProduct(VehicleMaintenance vehicleMaintenance, Product product)
        {
            VehicleMaintenance =
                vehicleMaintenance ?? throw new ArgumentNullException(nameof(vehicleMaintenance));
            VehicleMaintenanceId = vehicleMaintenance.Id;

            Product = product ?? throw new ArgumentNullException(nameof(product));
            ProductId = product.Id;
        }
    }
}
