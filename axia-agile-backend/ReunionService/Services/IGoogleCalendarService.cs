using ReunionService.DTOs;
using ReunionService.Models;

namespace ReunionService.Services;

public interface IGoogleCalendarService
{
    Task<Reunion> CreateEventAsync(string accessToken, ReunionCreateDto dto, string userId);
}