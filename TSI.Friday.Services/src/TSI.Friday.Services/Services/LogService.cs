using System.Text;
using System.Text.Json;
using TSI.Friday.Contracts.Interfaces;

namespace TSI.Friday.Services
{
    public class LogService : ILogService
    {
        #region Properties

        private static readonly object _lock = new();
        private readonly ICurrentUserService _currentUserService;

        #endregion Properties

        #region Public methods

        public LogService(ICurrentUserService currentUserService)
        {
            _currentUserService = currentUserService;
        }

        public void LogException(Exception ex, string? operation, object? payload = null)
        {
            try
            {
                var now = DateTime.UtcNow;
                var yyyyMM = now.ToString("yyyyMM");
                var yyyyMMdd = now.ToString("yyyyMMdd");

                var workspaceRoot =
                    FindWorkspaceRoot(AppContext.BaseDirectory) ?? Directory.GetCurrentDirectory();
                var logsDir = Path.Combine(workspaceRoot, "logs", yyyyMM);
                Directory.CreateDirectory(logsDir);

                var filePath = Path.Combine(logsDir, yyyyMMdd); // file name without extension per requirement

                var sb = new StringBuilder();
                sb.AppendLine("----------------------------------------------------------------");
                sb.AppendLine($"TimestampUtc: {now:yyyy-MM-dd HH:mm:ss.fff}Z");
                sb.AppendLine($"Operation: {operation}");

                string? user = null;
                try
                {
                    user = _currentUserService?.GetUserId();
                }
                catch
                {
                    // ignore
                }

                sb.AppendLine($"User: {user ?? "(unknown)"}");
                sb.AppendLine($"ExceptionType: {ex.GetType().FullName}");
                sb.AppendLine($"Message: {ex.Message}");
                sb.AppendLine("StackTrace:");
                sb.AppendLine(ex.StackTrace ?? string.Empty);

                if (payload != null)
                {
                    try
                    {
                        var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { WriteIndented = true });
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

        private static string? FindWorkspaceRoot(string startPath)
        {
            try
            {
                var dir = new DirectoryInfo(startPath);
                while (dir != null && dir.FullName != dir.Root.FullName)
                {
                    if (
                        Directory.Exists(Path.Combine(dir.FullName, ".git"))
                        || dir.GetFiles("*.sln").Any()
                        || string.Equals(dir.Name, "TSI.Friday", StringComparison.OrdinalIgnoreCase)
                    )
                    {
                        return dir.FullName;
                    }

                    dir = dir.Parent;
                }
            }
            catch
            {
                // ignore
            }

            return null;
        }

        #endregion Private methods
    }
}
