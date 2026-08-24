using System;
using System.ComponentModel.DataAnnotations;

namespace TSI.Nexus.Contracts.Models
{
    public abstract class BaseModel
    {
        public Guid Id { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime CreateDate { get; set; }

        public string CreateUserId { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime ModifyDate { get; set; }

        public string ModifyUserId { get; set; }
    }
}
