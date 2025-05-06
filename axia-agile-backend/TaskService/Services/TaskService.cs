using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using TaskService.Data;
using TaskService.DTOs;
using TaskService.Models;
using Task = TaskService.Models.Task;

namespace TaskService.Services
{
    public class TaskService
    {
        private readonly UserServiceClient _userServiceClient;
        private readonly ILogger<TaskService> _logger;
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly FileStorageService _fileStorageService;

        public TaskService(
            UserServiceClient userServiceClient,
            ILogger<TaskService> logger,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            FileStorageService fileStorageService)
        {
            _userServiceClient = userServiceClient;
            _logger = logger;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _fileStorageService = fileStorageService;
        }

        public async Task<TaskDTO> CreateTaskAsync(CreateTaskRequest request, List<IFormFile> attachments, int userId)
        {
            _logger.LogDebug($"Starting CreateTaskAsync for user {userId}");

            try
            {
                if (request == null)
                {
                    _logger.LogError("CreateTaskAsync: Request is null.");
                    throw new ArgumentNullException(nameof(request), "La requête de création de tâche est nulle.");
                }

                try
                {
                    request.Validate();
                    _logger.LogDebug("Request validated successfully.");
                }
                catch (ArgumentException ex)
                {
                    _logger.LogError(ex, "CreateTaskAsync: Validation failed.");
                    throw new InvalidOperationException($"Erreur de validation : {ex.Message}");
                }

                // Bypassed user validation for testing
                /*
                var userValid = await _userServiceClient.ValidateUserAsync(userId);
                if (!userValid)
                {
                    _logger.LogWarning($"User {userId} is not valid or unauthorized.");
                    throw new InvalidOperationException("Utilisateur non valide ou non autorisé.");
                }
                */

                var assignedUserIds = new List<int>();
                if (request.AssignedUserEmails != null && request.AssignedUserEmails.Any())
                {
                    _logger.LogDebug($"Validating {request.AssignedUserEmails.Count} emails...");
                    try
                    {
                        var userIdsByEmail = await _userServiceClient.GetUserIdsByEmailsAsync(request.AssignedUserEmails);
                        var invalidEmails = new List<string>();

                        foreach (var email in request.AssignedUserEmails)
                        {
                            if (userIdsByEmail.ContainsKey(email))
                            {
                                assignedUserIds.Add(userIdsByEmail[email]);
                            }
                            else
                            {
                                invalidEmails.Add(email);
                            }
                        }

                        if (invalidEmails.Any())
                        {
                            throw new InvalidOperationException($"Les utilisateurs avec les emails suivants n'ont pas été trouvés : {string.Join(", ", invalidEmails)}.");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed to validate assigned user emails");
                        throw new InvalidOperationException("Erreur lors de la validation des emails des utilisateurs assignés.", ex);
                    }
                }

                var attachmentDtos = new List<AttachmentDTO>();
                if (attachments != null && attachments.Any())
                {
                    foreach (var attachment in attachments)
                    {
                        if (attachment == null || attachment.Length == 0)
                        {
                            _logger.LogWarning("Empty or null attachment provided.");
                            continue;
                        }
                        try
                        {
                            var filePath = await _fileStorageService.SaveFileAsync(attachment);
                            attachmentDtos.Add(new AttachmentDTO
                            {
                                FileName = attachment.FileName,
                                FilePath = filePath,
                                UploadedAt = DateTime.UtcNow,
                                UploadedByUserId = userId
                            });
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Failed to save attachment {attachment.FileName}");
                            throw new InvalidOperationException($"Erreur lors de l'enregistrement de la pièce jointe {attachment.FileName}.", ex);
                        }
                    }
                }

                var task = new Task
                {
                    Title = request.Title,
                    Description = request.Description,
                    Priority = request.Priority,
                    Status = request.Status,
                    CreatedByUserId = userId,
                    CreatedAt = DateTime.UtcNow,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    AssignedUserIds = assignedUserIds.Any() ? string.Join(",", assignedUserIds) : null,
                    Attachments = attachmentDtos.Any() ? JsonSerializer.Serialize(attachmentDtos) : null
                };

                try
                {
                    _context.Tasks.Add(task);
                    await _context.SaveChangesAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to save task to database");
                    throw new InvalidOperationException("Erreur lors de l'enregistrement de la tâche dans la base de données.", ex);
                }

                var taskDto = new TaskDTO
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Priority = task.Priority,
                    Status = task.Status,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedAt = task.CreatedAt,
                    StartDate = task.StartDate,
                    EndDate = task.EndDate,
                    Attachments = attachmentDtos,
                    AssignedUserIds = assignedUserIds,
                    AssignedUserEmails = request.AssignedUserEmails
                };

                _logger.LogInformation($"Task {task.Title} created for user {userId}.");
                return taskDto;
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"Error in CreateTaskAsync: {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unexpected error in CreateTaskAsync: {ex.Message}");
                throw new InvalidOperationException("Erreur inattendue lors de la création de la tâche.", ex);
            }
        }

        public async Task<TaskDTO> GetTaskByIdAsync(int id)
        {
            try
            {
                var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
                if (task == null) return null;

                var assignedUserIds = string.IsNullOrEmpty(task.AssignedUserIds)
                    ? new List<int>()
                    : task.AssignedUserIds.Split(',').Select(int.Parse).ToList();

                var assignedUserEmails = new List<string>();
                if (assignedUserIds.Any())
                {
                    try
                    {
                        assignedUserEmails = await _userServiceClient.GetEmailsByUserIdsAsync(assignedUserIds);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to retrieve emails for task {id}");
                        assignedUserEmails = new List<string>();
                    }
                }

                var attachments = string.IsNullOrEmpty(task.Attachments)
                    ? new List<AttachmentDTO>()
                    : JsonSerializer.Deserialize<List<AttachmentDTO>>(task.Attachments);

                return new TaskDTO
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Priority = task.Priority,
                    Status = task.Status,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    StartDate = task.StartDate,
                    EndDate = task.EndDate,
                    Attachments = attachments,
                    AssignedUserIds = assignedUserIds,
                    AssignedUserEmails = assignedUserEmails
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving task {id}");
                throw;
            }
        }

        public async Task<List<TaskDTO>> GetAllTasksAsync()
        {
            try
            {
                // Bypassed user validation for testing
                /*
                var userId = GetUserIdFromContext();
                if (userId.HasValue)
                {
                    try
                    {
                        var userValid = await _userServiceClient.ValidateUserAsync(userId.Value);
                        if (!userValid)
                        {
                            _logger.LogWarning($"User {userId.Value} is not valid or unauthorized.");
                            return new List<TaskDTO>();
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to validate user {userId.Value}");
                        return new List<TaskDTO>();
                    }
                }
                */

                List<Task> tasks;
                try
                {
                    tasks = await _context.Tasks.ToListAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to retrieve tasks from database");
                    return new List<TaskDTO>();
                }

                var taskDtos = new List<TaskDTO>();
                foreach (var task in tasks)
                {
                    var assignedUserIds = string.IsNullOrEmpty(task.AssignedUserIds)
                        ? new List<int>()
                        : task.AssignedUserIds.Split(',').Select(int.Parse).ToList();

                    var assignedUserEmails = new List<string>();
                    if (assignedUserIds.Any())
                    {
                        try
                        {
                            assignedUserEmails = await _userServiceClient.GetEmailsByUserIdsAsync(assignedUserIds);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, $"Failed to retrieve emails for task {task.Id}");
                            assignedUserEmails = new List<string>();
                        }
                    }

                    var attachments = string.IsNullOrEmpty(task.Attachments)
                        ? new List<AttachmentDTO>()
                        : JsonSerializer.Deserialize<List<AttachmentDTO>>(task.Attachments);

                    taskDtos.Add(new TaskDTO
                    {
                        Id = task.Id,
                        Title = task.Title,
                        Description = task.Description,
                        Priority = task.Priority,
                        Status = task.Status,
                        CreatedByUserId = task.CreatedByUserId,
                        CreatedAt = task.CreatedAt,
                        UpdatedAt = task.UpdatedAt,
                        StartDate = task.StartDate,
                        EndDate = task.EndDate,
                        Attachments = attachments,
                        AssignedUserIds = assignedUserIds,
                        AssignedUserEmails = assignedUserEmails
                    });
                }

                return taskDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetAllTasksAsync");
                return new List<TaskDTO>();
            }
        }

        public async Task<TaskDTO> UpdateTaskAsync(int id, UpdateTaskRequest request, List<IFormFile> attachments, int userId)
        {
            try
            {
                var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
                if (task == null) return null;

                // Bypassed user validation for testing
                /*
                var userValid = await _userServiceClient.ValidateUserAsync(userId);
                if (!userValid)
                {
                    throw new InvalidOperationException("Utilisateur non valide ou non autorisé.");
                }
                */

                var assignedUserIds = new List<int>();
                if (request.AssignedUserEmails != null && request.AssignedUserEmails.Any())
                {
                    var userIdsByEmail = await _userServiceClient.GetUserIdsByEmailsAsync(request.AssignedUserEmails);
                    foreach (var email in request.AssignedUserEmails)
                    {
                        if (!userIdsByEmail.ContainsKey(email))
                        {
                            throw new InvalidOperationException($"Utilisateur avec l'email {email} non trouvé.");
                        }
                        assignedUserIds.Add(userIdsByEmail[email]);
                    }
                }

                var existingAttachments = string.IsNullOrEmpty(task.Attachments)
                    ? new List<AttachmentDTO>()
                    : JsonSerializer.Deserialize<List<AttachmentDTO>>(task.Attachments);
                var attachmentDtos = existingAttachments;

                if (attachments != null && attachments.Any())
                {
                    foreach (var attachment in attachments)
                    {
                        var filePath = await _fileStorageService.SaveFileAsync(attachment);
                        attachmentDtos.Add(new AttachmentDTO
                        {
                            FileName = attachment.FileName,
                            FilePath = filePath,
                            UploadedAt = DateTime.UtcNow,
                            UploadedByUserId = userId
                        });
                    }
                }

                task.Title = request.Title ?? task.Title;
                task.Description = request.Description ?? task.Description;
                task.Priority = request.Priority ?? task.Priority;
                task.Status = request.Status ?? task.Status;
                task.StartDate = request.StartDate ?? task.StartDate;
                task.EndDate = request.EndDate ?? task.EndDate;
                task.UpdatedAt = DateTime.UtcNow;
                task.AssignedUserIds = assignedUserIds.Any() ? string.Join(",", assignedUserIds) : null;
                task.Attachments = attachmentDtos.Any() ? JsonSerializer.Serialize(attachmentDtos) : null;

                _context.Tasks.Update(task);
                await _context.SaveChangesAsync();

                return new TaskDTO
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Priority = task.Priority,
                    Status = task.Status,
                    CreatedByUserId = task.CreatedByUserId,
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    StartDate = task.StartDate,
                    EndDate = task.EndDate,
                    Attachments = attachmentDtos,
                    AssignedUserIds = assignedUserIds,
                    AssignedUserEmails = request.AssignedUserEmails
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating task {id}");
                throw;
            }
        }

        public async Task<bool> DeleteTaskAsync(int id)
        {
            try
            {
                var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id);
                if (task == null) return false;

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting task {id}");
                throw;
            }
        }

        private int? GetUserIdFromContext()
        {
            try
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    _logger.LogWarning("No valid user ID found in JWT claims");
                    return null;
                }
                return userId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving user ID from context");
                return null;
            }
        }
    }
}