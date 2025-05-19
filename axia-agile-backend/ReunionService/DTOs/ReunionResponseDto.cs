namespace ReunionService.DTOs;

public class ReunionResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Location { get; set; }
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public string? MeetLink { get; set; }
    public string HtmlLink { get; set; } = string.Empty;
}