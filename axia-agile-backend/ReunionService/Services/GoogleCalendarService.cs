using Google.Apis.Auth.OAuth2;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Google.Apis.Services;
using ReunionService.Data;
using ReunionService.DTOs;
using ReunionService.Models;

namespace ReunionService.Services;

public class GoogleCalendarService : IGoogleCalendarService
{
    private readonly IReunionRepository _reunionRepository;

    public GoogleCalendarService(IReunionRepository reunionRepository)
    {
        _reunionRepository = reunionRepository;
    }

    public async Task<Reunion> CreateEventAsync(string accessToken, ReunionCreateDto dto, string userId)
    {
        var credential = GoogleCredential.FromAccessToken(accessToken);
        var service = new CalendarService(new BaseClientService.Initializer
        {
            HttpClientInitializer = credential,
            ApplicationName = "ReunionService",
        });

        var startDateTime = DateTime.Parse($"{dto.StartDate}T{dto.StartTime}");
        var endDateTime = DateTime.Parse($"{dto.EndDate}T{dto.EndTime}");

        var attendees = dto.Attendees
            .Split(',', StringSplitOptions.RemoveEmptyEntries)
            .Select(email => email.Trim())
            .Where(email => !string.IsNullOrEmpty(email))
            .Select(email => new EventAttendee { Email = email })
            .ToList();

        var calendarEvent = new Event
        {
            Summary = dto.Summary,
            Description = dto.Description,
            Location = dto.Location,
            Start = new EventDateTime
            {
                DateTime = startDateTime,
                TimeZone = TimeZoneInfo.Local.Id
            },
            End = new EventDateTime
            {
                DateTime = endDateTime,
                TimeZone = TimeZoneInfo.Local.Id
            },
            Attendees = attendees,
            ConferenceData = dto.WithMeet ? new ConferenceData
            {
                CreateRequest = new CreateConferenceRequest
                {
                    RequestId = $"meet-{DateTime.Now.Ticks}",
                    ConferenceSolutionKey = new ConferenceSolutionKey { Type = "hangoutsMeet" }
                }
            } : null
        };

        var request = service.Events.Insert(calendarEvent, "primary");
        if (dto.WithMeet)
        {
            request.ConferenceDataVersion = 1;
        }
        request.SendNotifications = true;

        var createdEvent = await request.ExecuteAsync();

        var meetLink = createdEvent.ConferenceData?.EntryPoints
            ?.FirstOrDefault(ep => ep.EntryPointType == "video")?.Uri;

        var reunion = new Reunion
        {
            Id = createdEvent.Id,
            Summary = createdEvent.Summary,
            Description = createdEvent.Description,
            Location = createdEvent.Location,
            StartDateTime = createdEvent.Start.DateTime ?? DateTime.Now,
            EndDateTime = createdEvent.End.DateTime ?? DateTime.Now,
            MeetLink = meetLink,
            HtmlLink = createdEvent.HtmlLink,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        await _reunionRepository.AddReunionAsync(reunion);
        return reunion;
    }
}