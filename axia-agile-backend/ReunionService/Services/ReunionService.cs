using Google.Apis.Meet.v2;
using Google.Apis.Meet.v2.Data;
using Google.Apis.Calendar.v3;
using Google.Apis.Calendar.v3.Data;
using Microsoft.EntityFrameworkCore;
using ReunionService.Data;
using ReunionService.Models;

namespace ReunionService.Services
{
    public class ReunionService
    {
        private readonly AppDbContext _context;
        private readonly MeetService _meetService;
        private readonly CalendarService _calendarService;
        private readonly ILogger<ReunionService> _logger;

        public ReunionService(AppDbContext context, MeetService meetService, CalendarService calendarService, ILogger<ReunionService> logger)
        {
            _context = context;
            _meetService = meetService;
            _calendarService = calendarService;
            _logger = logger;
        }

        public async Task<Reunion> CreateReunionAsync(int userId, string title, DateTime startTime, DateTime endTime)
        {
            try
            {
                // Create a Google Meet space
                var space = new Space();
                var spaceRequest = _meetService.Spaces.Create(space);
                var createdSpace = await spaceRequest.ExecuteAsync();

                if (string.IsNullOrEmpty(createdSpace.MeetingUri))
                {
                    _logger.LogError("Google Meet API returned a space without a MeetingUri.");
                    throw new Exception("Failed to create a valid Google Meet space.");
                }

                // Create a Google Calendar event
                var calendarEvent = new Event
                {
                    Summary = title,
                    Start = new EventDateTime { DateTimeDateTimeOffset = startTime, TimeZone = "UTC" },
                    End = new EventDateTime { DateTimeDateTimeOffset = endTime, TimeZone = "UTC" },
                    ConferenceData = new ConferenceData
                    {
                        CreateRequest = new CreateConferenceRequest
                        {
                            RequestId = Guid.NewGuid().ToString(),
                            ConferenceSolutionKey = new ConferenceSolutionKey { Type = "hangoutsMeet" }
                        }
                    }
                };

                var calendarRequest = _calendarService.Events.Insert(calendarEvent, "primary");
                calendarRequest.ConferenceDataVersion = 1;
                var createdEvent = await calendarRequest.ExecuteAsync();

                // Create a Reunion entity
                var reunion = new Reunion
                {
                    Title = title,
                    MeetingUri = createdSpace.MeetingUri,
                    StartTime = startTime,
                    EndTime = endTime,
                    CalendarEventId = createdEvent.Id,
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow
                };

                // Save to database
                _context.Reunions.Add(reunion);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Google Meet reunion created successfully. MeetingUri: {MeetingUri}, CalendarEventId: {CalendarEventId}", reunion.MeetingUri, reunion.CalendarEventId);
                return reunion;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating Google Meet reunion for user: {UserId}", userId);
                throw;
            }
        }

        public async Task<List<Reunion>> GetReunionsByUserAsync(int userId)
        {
            return await _context.Reunions
                .Where(r => r.CreatedByUserId == userId)
                .ToListAsync();
        }
    }
}