using System.Threading.Tasks;
using TSI.Friday.Contracts.Models;

namespace TSI.Friday.Contracts.Interfaces
{
 public interface IOverdueService
 {
 Task<OverdueResult> RunOverdueUpdateAsync();
 }
}
