namespace ReunionService.DTOs;

public class ReunionCreateDto
{
    public string Summary { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string StartDate { get; set; } = string.Empty;
    public string StartTime { get; set; } = string.Empty;
    public string EndDate { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public string Attendees { get; set; } = string.Empty;
    public bool WithMeet { get; set; }
}