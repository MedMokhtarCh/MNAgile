
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly ProjectServiceClient _projectServiceClient;
        private readonly KanbanColumnService _kanbanColumnService;
        private readonly BacklogService _backlogService; 
        private readonly ILogger<TaskService> _logger;
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly FileStorageService _fileStorageService;

        public TaskService(
            UserServiceClient userServiceClient,
            ProjectServiceClient projectServiceClient,
            KanbanColumnService kanbanColumnService,
            BacklogService backlogService,
            ILogger<TaskService> logger,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            FileStorageService fileStorageService)
        {
            _userServiceClient = userServiceClient;
            _projectServiceClient = projectServiceClient;
            _kanbanColumnService = kanbanColumnService;
            _backlogService = backlogService;
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

                var projectExists = await _projectServiceClient.ProjectExistsAsync(request.ProjectId);
                if (!projectExists)
                {
                    _logger.LogWarning($"Project {request.ProjectId} does not exist.");
                    throw new InvalidOperationException($"Le projet avec l'ID {request.ProjectId} n'existe pas.");
                }

                var columns = await _kanbanColumnService.GetColumnsByProjectAsync(request.ProjectId);
                if (!columns.Any(c => c.Name == request.Status))
                {
                    _logger.LogWarning($"Invalid status {request.Status} for project {request.ProjectId}.");
                    throw new InvalidOperationException($"Le statut '{request.Status}' n'est pas valide pour ce projet.");
                }

                // Validate backlog IDs
                if (request.BacklogIds != null && request.BacklogIds.Any())
                {
                    var backlogs = await _context.Backlogs
                        .Where(b => b.ProjectId == request.ProjectId && request.BacklogIds.Contains(b.Id))
                        .ToListAsync();
                    if (backlogs.Count != request.BacklogIds.Count)
                    {
                        _logger.LogWarning($"One or more backlog IDs are invalid for project {request.ProjectId}.");
                        throw new InvalidOperationException("Un ou plusieurs IDs de backlog sont invalides pour ce projet.");
                    }
                }

                var assignedUserIds = new List<int>();
                if (request.AssignedUserEmails != null && request.AssignedUserEmails.Any())
                {
                    _logger.LogDebug($"Validating {request.AssignedUserEmails.Count} emails...");
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
                    Attachments = attachmentDtos.Any() ? JsonSerializer.Serialize(attachmentDtos) : null,
                    ProjectId = request.ProjectId
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // Link to backlogs
                if (request.BacklogIds != null && request.BacklogIds.Any())
                {
                    foreach (var backlogId in request.BacklogIds)
                    {
                        await _backlogService.LinkTaskToBacklogAsync(backlogId, task.Id);
                    }
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
                    AssignedUserEmails = request.AssignedUserEmails,
                    ProjectId = task.ProjectId,
                    BacklogIds = request.BacklogIds
                };

                _logger.LogInformation($"Task {task.Title} created for user {userId} in project {task.ProjectId}.");
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
                var task = await _context.Tasks
                    .Include(t => t.TaskBacklogs)
                    .FirstOrDefaultAsync(t => t.Id == id);
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

                var backlogIds = task.TaskBacklogs.Select(tb => tb.BacklogId).ToList();

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
                    AssignedUserEmails = assignedUserEmails,
                    ProjectId = task.ProjectId,
                    BacklogIds = backlogIds
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving task {id}");
                throw;
            }
        }

        public async Task<List<TaskDTO>> GetAllTasksAsync(int? projectId = null, int? backlogId = null)
        {
            try
            {
                IQueryable<Task> query = _context.Tasks.Include(t => t.TaskBacklogs);

                if (projectId.HasValue)
                {
                    if (!await _projectServiceClient.ProjectExistsAsync(projectId.Value))
                    {
                        _logger.LogWarning($"Project {projectId.Value} does not exist.");
                        return new List<TaskDTO>();
                    }
                    query = query.Where(t => t.ProjectId == projectId.Value);
                }

                if (backlogId.HasValue)
                {
                    query = query.Where(t => t.TaskBacklogs.Any(tb => tb.BacklogId == backlogId.Value));
                }

                var tasks = await query.ToListAsync();
                _logger.LogDebug($"Retrieved {tasks.Count} tasks from database.");

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

                    var backlogIds = task.TaskBacklogs.Select(tb => tb.BacklogId).ToList();

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
                        AssignedUserEmails = assignedUserEmails,
                        ProjectId = task.ProjectId,
                        BacklogIds = backlogIds
                    });
                }

                _logger.LogInformation($"Returning {taskDtos.Count} tasks.");
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
                var task = await _context.Tasks
                    .Include(t => t.TaskBacklogs)
                    .FirstOrDefaultAsync(t => t.Id == id);
                if (task == null) return null;

                if (request.ProjectId.HasValue && !await _projectServiceClient.ProjectExistsAsync(request.ProjectId.Value))
                {
                    _logger.LogWarning($"Project {request.ProjectId.Value} does not exist.");
                    throw new InvalidOperationException($"Le projet avec l'ID {request.ProjectId.Value} n'existe pas.");
                }

                if (!string.IsNullOrEmpty(request.Status))
                {
                    var columns = await _kanbanColumnService.GetColumnsByProjectAsync(task.ProjectId);
                    if (!columns.Any(c => c.Name == request.Status))
                    {
                        _logger.LogWarning($"Invalid status {request.Status} for project {task.ProjectId}.");
                        throw new InvalidOperationException($"Le statut '{request.Status}' n'est pas valide pour ce projet.");
                    }
                }

                // Validate backlog IDs
                if (request.BacklogIds != null)
                {
                    var backlogs = await _context.Backlogs
                        .Where(b => b.ProjectId == task.ProjectId && request.BacklogIds.Contains(b.Id))
                        .ToListAsync();
                    if (backlogs.Count != request.BacklogIds.Count)
                    {
                        _logger.LogWarning($"One or more backlog IDs are invalid for project {task.ProjectId}.");
                        throw new InvalidOperationException("Un ou plusieurs IDs de backlog sont invalides pour ce projet.");
                    }
                }

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
                task.ProjectId = request.ProjectId ?? task.ProjectId;
                task.UpdatedAt = DateTime.UtcNow;
                task.AssignedUserIds = assignedUserIds.Any() ? string.Join(",", assignedUserIds) : null;
                task.Attachments = attachmentDtos.Any() ? JsonSerializer.Serialize(attachmentDtos) : null;

                // Update backlog links
                if (request.BacklogIds != null)
                {
                    var existingBacklogIds = task.TaskBacklogs.Select(tb => tb.BacklogId).ToList();
                    var backlogsToAdd = request.BacklogIds.Except(existingBacklogIds).ToList();
                    var backlogsToRemove = existingBacklogIds.Except(request.BacklogIds).ToList();

                    foreach (var backlogId in backlogsToAdd)
                    {
                        await _backlogService.LinkTaskToBacklogAsync(backlogId, task.Id);
                    }

                    foreach (var backlogId in backlogsToRemove)
                    {
                        await _backlogService.UnlinkTaskFromBacklogAsync(backlogId, task.Id);
                    }
                }

                _context.Tasks.Update(task);
                await _context.SaveChangesAsync();

                var updatedBacklogIds = task.TaskBacklogs.Select(tb => tb.BacklogId).ToList();

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
                    AssignedUserEmails = request.AssignedUserEmails,
                    ProjectId = task.ProjectId,
                    BacklogIds = updatedBacklogIds
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
                var task = await _context.Tasks
                    .Include(t => t.TaskBacklogs)
                    .FirstOrDefaultAsync(t => t.Id == id);
                if (task == null) return false;

                _context.TaskBacklogs.RemoveRange(task.TaskBacklogs);
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