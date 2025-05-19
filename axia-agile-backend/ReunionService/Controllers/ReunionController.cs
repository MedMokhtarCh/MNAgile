using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ReunionService.Data;
using ReunionService.DTOs;
using ReunionService.Services;

namespace ReunionService.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class ReunionController : ControllerBase
{
    private readonly IGoogleCalendarService _calendarService;
    private readonly IReunionRepository _reunionRepository;

    public ReunionController(IGoogleCalendarService calendarService, IReunionRepository reunionRepository)
    {
        _calendarService = calendarService;
        _reunionRepository = reunionRepository;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReunion([FromBody] ReunionCreateDto dto, [FromHeader(Name = "X-Access-Token")] string accessToken)
    {
        var userId = User.Identity?.Name;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reunion = await _calendarService.CreateEventAsync(accessToken, dto, userId);
        var responseDto = new ReunionResponseDto
        {
            Id = reunion.Id,
            Summary = reunion.Summary,
            Description = reunion.Description,
            Location = reunion.Location,
            StartDateTime = reunion.StartDateTime,
            EndDateTime = reunion.EndDateTime,
            MeetLink = reunion.MeetLink,
            HtmlLink = reunion.HtmlLink
        };

        return Ok(responseDto);
    }

    [HttpGet]
    public async Task<IActionResult> GetReunions()
    {
        var userId = User.Identity?.Name;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        var reunions = await _reunionRepository.GetReunionsByUserAsync(userId);
        var responseDtos = reunions.Select(r => new ReunionResponseDto
        {
            Id = r.Id,
            Summary = r.Summary,
            Description = r.Description,
            Location = r.Location,
            StartDateTime = r.StartDateTime,
            EndDateTime = r.EndDateTime,
            MeetLink = r.MeetLink,
            HtmlLink = r.HtmlLink
        }).ToList();

        return Ok(responseDtos);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteReunion(string id)
    {
        var userId = User.Identity?.Name;
        if (string.IsNullOrEmpty(userId))
            return Unauthorized();

        await _reunionRepository.DeleteReunionAsync(id, userId);
        return NoContent();
    }
}