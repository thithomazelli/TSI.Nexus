using System;
using System.ComponentModel.DataAnnotations;

namespace TSI.Friday.Contracts.Models
{
    public abstract class BaseModel
    {
        [DataType(DataType.DateTime)]
        public DateTime CreateDate { get; set; } = DateTime.UtcNow;

        public int CreateUserId { get; set; }

        [DataType(DataType.DateTime)]
        public DateTime ModifyDate { get; set; } = DateTime.UtcNow;

        public int ModifyUserId { get; set; }
    }
}
