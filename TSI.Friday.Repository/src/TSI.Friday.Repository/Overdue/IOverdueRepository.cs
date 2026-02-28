using System;
using System.Threading.Tasks;

namespace TSI.Friday.Repository.Overdue
{
 public interface IOverdueRepository
 {
 Task<int> MarkOverdueOrderProductsAsync(DateTime nowUtc, string systemUserId);
 Task<int> MarkOverduePaymentsAsync(DateTime nowUtc, string systemUserId);
 }
}
