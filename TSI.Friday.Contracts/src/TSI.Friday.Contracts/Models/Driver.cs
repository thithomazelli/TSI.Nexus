using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Models
{
    public class Driver : BaseModel
    {
        public string Name { get; set; }

        [RegularExpression(
            @"^([\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+\.)*[\w\!\#$\%\&\'*\+\-\/\=\?\^`{\|\}\~]+@((((([a-zA-Z0-9]{1}[a-zA-Z0-9\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\.)+[a-zA-Z]{2,6})|(\d{1,3}\.){3}\d{1,3}(\:\d{1,5})?)$",
            ErrorMessage = "Invalid email address"
        )]
        public string Email { get; set; }

        public string Phone { get; set; }

        public string Mobile { get; set; }

        public string Photo { get; set; }

        public string SocialSecurityCard { get; set; }

        public string NationalIdCard { get; set; }

        public DateTime Birthday { get; set; }

        public string LicenseNumber { get; set; }

        public string LicenseCategory { get; set; }

        public DateTime LicenseExpiryDate { get; set; }

        public EmploymentType EmploymentType { get; set; }

        public DateTime? AdmissionDate { get; set; }

        public DriverStatus Status { get; set; }

        public decimal CommissionPercentage { get; set; }

        public virtual ICollection<Trip> Trips { get; set; } = new List<Trip>();

        public virtual ICollection<ServiceOrder> ServiceOrders { get; set; } =
            new List<ServiceOrder>();

        public virtual ICollection<TripDriver> TripDrivers { get; set; } = new List<TripDriver>();

        public ICollection<Attachment> Attachments { get; set; }
    }
}
