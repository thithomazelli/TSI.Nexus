using System;
using System.Threading.Tasks;

namespace TSI.Friday.Repository.Overdue
{
 public interface IOverdueRepository
 {
 Task<int> MarkOverdueOrderProductsAsync(string systemUserId);
 Task<int> MarkOverduePaymentsAsync(string systemUserId);
 }
}
