using System;

namespace TSI.Nexus.Contracts.Interfaces
{
    public interface ILogService
    {
        /// <summary>
        /// LogException method created to log the exceptions on a file with the details of the exception
        /// and the operation that was being executed when the exception was thrown.
        /// </summary>
        /// <param name="ex">Exception to log</param>
        /// <param name="operation">Operation being executed</param>
        /// <param name="payload">Optional object that was used in the operation (will be serialized to JSON)</param>
        void LogException(Exception ex, string operation, object? payload = null);
    }
}
