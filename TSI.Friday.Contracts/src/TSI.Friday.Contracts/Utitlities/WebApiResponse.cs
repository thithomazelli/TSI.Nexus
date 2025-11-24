using TSI.Friday.Contracts.Enums;

namespace TSI.Friday.Contracts.Utitlities
{
    public class WebApiResponse<T> where T : class
    {
        public T? Data { get; set; }

        public string Message { get; set; }

        public ResponseStatus Status { get; set; }
    }
}
