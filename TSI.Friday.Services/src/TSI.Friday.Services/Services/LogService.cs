using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.Services
{
    public class LogService : ILogService
    {
        #region Properties

        private readonly IWebHostEnvironment _env;
        private static readonly object _lock = new();
        private readonly ICurrentUserService _currentUserService;

        #endregion Properties

        #region Public methods

        public LogService(IWebHostEnvironment env, ICurrentUserService currentUserService)
        {
            _env = env ?? throw new ArgumentNullException(nameof(env));
            _currentUserService = currentUserService;
        }

        public void LogException(Exception ex, string operation, object? payload = null)
        {
            try
            {
                var now = DateTime.UtcNow;
                var yyyyMM = now.ToString("yyyyMM");
                var yyyyMMdd = now.ToString("yyyyMMdd");

                var configuredLogs = "Logs";
                string logsRoot;

                logsRoot = Path.IsPathRooted(configuredLogs)
                    ? Path.GetFullPath(configuredLogs)
                    : Path.GetFullPath(Path.Combine(_env.ContentRootPath, configuredLogs));

                var logsDir = Path.Combine(logsRoot, yyyyMM);
                Directory.CreateDirectory(logsDir);

                // file name should have .log extension
                var filePath = Path.Combine(logsDir, yyyyMMdd + ".log");

                var sb = new StringBuilder();
                sb.AppendLine("----------------------------------------------------------------");
                sb.AppendLine($"TimestampUtc: {now:yyyy-MM-dd HH:mm:ss.fff}Z");
                sb.AppendLine($"Operation: {operation}");

                string userName = null;
                try
                {
                    userName = _currentUserService?.GetUserName();
                }
                catch
                {
                    // ignore
                }

                sb.AppendLine($"User: {userName ?? "(unknown)"}");
                sb.AppendLine($"ExceptionType: {ex.GetType().FullName}");
                sb.AppendLine($"Message: {ex.Message}");
                sb.AppendLine("StackTrace:");
                sb.AppendLine(ex.StackTrace ?? string.Empty);

                if (payload != null)
                {
                    try
                    {
                        var json = JsonSerializer.Serialize(
                            payload,
                            new JsonSerializerOptions { WriteIndented = true }
                        );
                        sb.AppendLine("Payload:");
                        sb.AppendLine(json);
                    }
                    catch
                    {
                        // ignore payload serialization errors
                    }
                }

                var inner = ex.InnerException;
                while (inner != null)
                {
                    sb.AppendLine("--- Inner Exception ---");
                    sb.AppendLine($"ExceptionType: {inner.GetType().FullName}");
                    sb.AppendLine($"Message: {inner.Message}");
                    sb.AppendLine(inner.StackTrace ?? string.Empty);
                    inner = inner.InnerException;
                }

                sb.AppendLine();

                lock (_lock)
                {
                    File.AppendAllText(filePath, sb.ToString());
                }
            }
            catch
            {
                // swallow to avoid throwing from logger
            }
        }

        #endregion Public methods

        #region Private methods

        #endregion Private methods
    }
}
