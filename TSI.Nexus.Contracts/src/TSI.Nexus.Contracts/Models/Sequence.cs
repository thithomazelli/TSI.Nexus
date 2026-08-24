namespace TSI.Nexus.Contracts.Models
{
    public class Sequence : BaseModel
    {
        public string Name { get; set; }

        public long NextVal { get; set; }
    }
}
