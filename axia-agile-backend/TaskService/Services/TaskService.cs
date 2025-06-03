using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.DTOs;
using Task = TaskService.Models.Task;

namespace TaskService.Services
{
    public class TaskService
    {
        private readonly UserServiceClient _userServiceClient;
        private readonly ProjectServiceClient _projectServiceClient;
        private readonly KanbanColumnService _kanbanColumnService;
        private readonly BacklogService _backlogService;
        private readonly SprintService _sprintService;
        private readonly ILogger<TaskService> _logger;
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly FileStorageService _fileStorageService;

        public TaskService(
            UserServiceClient userServiceClient,
            ProjectServiceClient projectServiceClient,
            KanbanColumnService kanbanColumnService,
            BacklogService backlogService,
            SprintService sprintService,
            ILogger<TaskService> logger,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            FileStorageService fileStorageService)
        {
            _userServiceClient = userServiceClient ?? throw new ArgumentNullException(nameof(userServiceClient));
            _projectServiceClient = projectServiceClient ?? throw new ArgumentNullException(nameof(projectServiceClient));
            _kanbanColumnService = kanbanColumnService ?? throw new ArgumentNullException(nameof(kanbanColumnService));
            _backlogService = backlogService ?? throw new ArgumentNullException(nameof(backlogService));
            _sprintService = sprintService ?? throw new ArgumentNullException(nameof(sprintService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _httpContextAccessor = httpContextAccessor ?? throw new ArgumentNullException(nameof(httpContextAccessor));
            _fileStorageService = fileStorageService ?? throw new ArgumentNullException(nameof(fileStorageService));
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

                if (request.SprintId.HasValue)
                {
                    var sprint = await _context.Sprints.FindAsync(request.SprintId.Value);
                    if (sprint == null || sprint.ProjectId != request.ProjectId)
                    {
                        _logger.LogWarning($"Sprint {request.SprintId} is invalid or does not belong to project {request.ProjectId}.");
                        throw new InvalidOperationException("L'ID du sprint est invalide ou ne correspond pas au projet.");
                    }
                }

                var assignedUserIds = new List<int>();
                var validAssignedUserEmails = new List<string>();
                if (request.AssignedUserEmails != null && request.AssignedUserEmails.Any(email => !string.IsNullOrEmpty(email)))
                {
                    _logger.LogDebug($"Validating {request.AssignedUserEmails.Count} emails...");
                    var userIdsByEmail = await _userServiceClient.GetUserIdsByEmailsAsync(request.AssignedUserEmails.Where(email => !string.IsNullOrEmpty(email)).ToList());
                    var invalidEmails = new List<string>();

                    foreach (var email in request.AssignedUserEmails.Where(email => !string.IsNullOrEmpty(email)))
                    {
                        if (userIdsByEmail.ContainsKey(email))
                        {
                            assignedUserIds.Add(userIdsByEmail[email]);
                            validAssignedUserEmails.Add(email);
                        }
                        else
                        {
                            invalidEmails.Add(email);
                            _logger.LogWarning($"Email {email} not found in UserService; skipping assignment.");
                        }
                    }

                    if (invalidEmails.Any())
                    {
                        _logger.LogInformation($"Skipped {invalidEmails.Count} invalid emails: {string.Join(", ", invalidEmails)}");
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
                    ProjectId = request.ProjectId,
                    Subtasks = request.Subtasks != null && request.Subtasks.Any() ? JsonSerializer.Serialize(request.Subtasks) : null,
                    SprintId = request.SprintId,
                    DisplayOrder = (int)request.DisplayOrder
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

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
                    AssignedUserEmails = validAssignedUserEmails,
                    ProjectId = task.ProjectId,
                    BacklogIds = request.BacklogIds,
                    Subtasks = request.Subtasks ?? new List<string>(),
                    SprintId = task.SprintId,
                    DisplayOrder = task.DisplayOrder
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

                var subtasks = string.IsNullOrEmpty(task.Subtasks)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(task.Subtasks);

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
                    BacklogIds = backlogIds,
                    Subtasks = subtasks,
                    SprintId = task.SprintId,
                    DisplayOrder = task.DisplayOrder
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving task {id}");
                throw;
            }
        }

        public async Task<List<TaskDTO>> GetAllTasksAsync(int? projectId = null, int? backlogId = null, int? sprintId = null)
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

                if (sprintId.HasValue)
                {
                    query = query.Where(t => t.SprintId == sprintId.Value);
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

                    var subtasks = string.IsNullOrEmpty(task.Subtasks)
                        ? new List<string>()
                        : JsonSerializer.Deserialize<List<string>>(task.Subtasks);

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
                        BacklogIds = backlogIds,
                        Subtasks = subtasks,
                        SprintId = task.SprintId,
                        DisplayOrder = task.DisplayOrder
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

                if (request.BacklogIds != null && request.BacklogIds.Any())
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

                if (request.SprintId.HasValue)
                {
                    var sprint = await _context.Sprints.FindAsync(request.SprintId.Value);
                    if (sprint == null || sprint.ProjectId != task.ProjectId)
                    {
                        _logger.LogWarning($"Sprint {request.SprintId} is invalid or does not belong to project {task.ProjectId}.");
                        throw new InvalidOperationException("L'ID du sprint est invalide ou ne correspond pas au projet.");
                    }
                }

                var assignedUserIds = new List<int>();
                var validAssignedUserEmails = new List<string>();
                if (request.AssignedUserEmails != null && request.AssignedUserEmails.Any(email => !string.IsNullOrEmpty(email)))
                {
                    var userIdsByEmail = await _userServiceClient.GetUserIdsByEmailsAsync(request.AssignedUserEmails.Where(email => !string.IsNullOrEmpty(email)).ToList());
                    var invalidEmails = new List<string>();
                    foreach (var email in request.AssignedUserEmails.Where(email => !string.IsNullOrEmpty(email)))
                    {
                        if (userIdsByEmail.ContainsKey(email))
                        {
                            assignedUserIds.Add(userIdsByEmail[email]);
                            validAssignedUserEmails.Add(email);
                        }
                        else
                        {
                            invalidEmails.Add(email);
                            _logger.LogWarning($"Email {email} not found in UserService; skipping assignment.");
                        }
                    }
                    if (invalidEmails.Any())
                    {
                        _logger.LogInformation($"Skipped {invalidEmails.Count} invalid emails during update: {string.Join(", ", invalidEmails)}");
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
                task.AssignedUserIds = request.AssignedUserEmails != null && request.AssignedUserEmails.Any(email => !string.IsNullOrEmpty(email))
                    ? (assignedUserIds.Any() ? string.Join(",", assignedUserIds) : null)
                    : task.AssignedUserIds;
                task.Attachments = attachmentDtos.Any() ? JsonSerializer.Serialize(attachmentDtos) : null;
                task.Subtasks = request.Subtasks != null ? JsonSerializer.Serialize(request.Subtasks) : task.Subtasks;
                task.SprintId = request.SprintId ?? task.SprintId;
                task.DisplayOrder = request.DisplayOrder ?? task.DisplayOrder;

                if (request.BacklogIds != null)
                {
                    var existingBacklogIds = task.TaskBacklogs.Select(tb => tb.BacklogId).ToList();
                    var targetBacklogIds = request.BacklogIds.Any() ? request.BacklogIds : new List<int>();
                    var backlogsToAdd = targetBacklogIds.Except(existingBacklogIds).ToList();
                    var backlogsToRemove = existingBacklogIds.Except(targetBacklogIds).ToList();

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
                    AssignedUserEmails = validAssignedUserEmails,
                    ProjectId = task.ProjectId,
                    BacklogIds = updatedBacklogIds,
                    Subtasks = request.Subtasks ?? JsonSerializer.Deserialize<List<string>>(task.Subtasks ?? "[]"),
                    SprintId = task.SprintId,
                    DisplayOrder = task.DisplayOrder
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

        public async Task<TaskDTO> UpdateTaskStatusAsync(int id, TaskStatusRequest request, int userId)
        {
            try
            {
                _logger.LogDebug($"Starting UpdateTaskStatusAsync for task {id} by user {userId}");

                if (request == null)
                {
                    _logger.LogError("UpdateTaskStatusAsync: Request is null.");
                    throw new ArgumentNullException(nameof(request), "La requête de mise à jour du statut est nulle.");
                }

                try
                {
                    request.Validate();
                    _logger.LogDebug("Status request validated successfully.");
                }
                catch (ArgumentException ex)
                {
                    _logger.LogError(ex, "UpdateTaskStatusAsync: Validation failed.");
                    throw new InvalidOperationException($"Erreur de validation : {ex.Message}");
                }

                var task = await _context.Tasks
                    .Include(t => t.TaskBacklogs)
                    .FirstOrDefaultAsync(t => t.Id == id);
                if (task == null)
                {
                    _logger.LogWarning($"Task {id} not found.");
                    return null;
                }

                var columns = await _kanbanColumnService.GetColumnsByProjectAsync(task.ProjectId);
                if (!columns.Any(c => c.Name == request.Status))
                {
                    _logger.LogWarning($"Invalid status {request.Status} for project {task.ProjectId}.");
                    throw new InvalidOperationException($"Le statut '{request.Status}' n'est pas valide pour ce projet.");
                }

                task.Status = request.Status;
                task.DisplayOrder = request.DisplayOrder;
                task.UpdatedAt = DateTime.UtcNow;

                _context.Tasks.Update(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {id} status updated to {task.Status} with displayOrder {task.DisplayOrder} by user {userId}");

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

                var subtasks = string.IsNullOrEmpty(task.Subtasks)
                    ? new List<string>()
                    : JsonSerializer.Deserialize<List<string>>(task.Subtasks);

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
                    BacklogIds = backlogIds,
                    Subtasks = subtasks,
                    SprintId = task.SprintId,
                    DisplayOrder = task.DisplayOrder
                };
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"UpdateTaskStatusAsync: Validation error - {ex.Message}");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateTaskStatusAsync: Unexpected error - {ex.Message}");
                throw new InvalidOperationException("Erreur inattendue lors de la mise à jour du statut de la tâche.", ex);
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