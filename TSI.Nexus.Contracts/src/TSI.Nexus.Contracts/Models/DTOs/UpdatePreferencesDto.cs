namespace TSI.Nexus.Contracts.Models.DTOs
{
    /// <summary>
    /// Payload for a user updating their own theme/language preferences (profile dropdown or
    /// profile page). Always targets the authenticated user - never another user's id.
    /// </summary>
    public class UpdatePreferencesDto
    {
        public string Theme { get; set; }

        public string Language { get; set; }
    }
}
