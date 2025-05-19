using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.DTOs;
using TaskService.Models;

namespace TaskService.Services
{
    public class BacklogService
    {
        private readonly AppDbContext _context;
        private readonly ProjectServiceClient _projectServiceClient;
        private readonly ILogger<BacklogService> _logger;

        public BacklogService(
            AppDbContext context,
            ProjectServiceClient projectServiceClient,
            ILogger<BacklogService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _projectServiceClient = projectServiceClient ?? throw new ArgumentNullException(nameof(projectServiceClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<BacklogDTO> CreateBacklogAsync(CreateBacklogRequest request)
        {
            try
            {
                request.Validate();

                var projectExists = await _projectServiceClient.ProjectExistsAsync(request.ProjectId);
                if (!projectExists)
                {
                    _logger.LogWarning($"Project {request.ProjectId} does not exist.");
                    throw new InvalidOperationException($"Le projet avec l'ID {request.ProjectId} n'existe pas.");
                }

                var existingBacklog = await _context.Backlogs
                    .FirstOrDefaultAsync(b => b.ProjectId == request.ProjectId && b.Name == request.Name);
                if (existingBacklog != null)
                {
                    _logger.LogWarning($"Backlog {request.Name} already exists for project {request.ProjectId}.");
                    throw new InvalidOperationException($"Un backlog avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                var backlog = new Backlog
                {
                    Name = request.Name,
                    Description = request.Description,
                    ProjectId = request.ProjectId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Backlogs.Add(backlog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Backlog {backlog.Name} created for project {backlog.ProjectId}.");
                return new BacklogDTO
                {
                    Id = backlog.Id,
                    Name = backlog.Name,
                    Description = backlog.Description,
                    ProjectId = backlog.ProjectId,
                    CreatedAt = backlog.CreatedAt,
                    TaskIds = new List<int>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating backlog: {ex.Message}");
                throw;
            }
        }

        public async Task<BacklogDTO> GetBacklogByIdAsync(int id)
        {
            try
            {
                var backlog = await _context.Backlogs
                    .Include(b => b.TaskBacklogs)
                    .ThenInclude(tb => tb.Task)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (backlog == null)
                {
                    _logger.LogWarning($"Backlog {id} not found.");
                    return null;
                }

                return new BacklogDTO
                {
                    Id = backlog.Id,
                    Name = backlog.Name,
                    Description = backlog.Description,
                    ProjectId = backlog.ProjectId,
                    CreatedAt = backlog.CreatedAt,
                    TaskIds = backlog.TaskBacklogs.Select(tb => tb.TaskId).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving backlog {id}");
                throw;
            }
        }

        public async Task<List<BacklogDTO>> GetBacklogsByProjectAsync(int projectId)
        {
            try
            {
                var backlogs = await _context.Backlogs
                    .Where(b => b.ProjectId == projectId)
                    .Include(b => b.TaskBacklogs)
                    .Select(b => new BacklogDTO
                    {
                        Id = b.Id,
                        Name = b.Name,
                        Description = b.Description,
                        ProjectId = b.ProjectId,
                        CreatedAt = b.CreatedAt,
                        TaskIds = b.TaskBacklogs.Select(tb => tb.TaskId).ToList()
                    })
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {backlogs.Count} backlogs for project {projectId}.");
                return backlogs;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving backlogs for project {projectId}");
                throw;
            }
        }

        public async Task<BacklogDTO> UpdateBacklogAsync(int id, UpdateBacklogRequest request)
        {
            try
            {
                request.Validate();

                var backlog = await _context.Backlogs.FindAsync(id);
                if (backlog == null)
                {
                    _logger.LogWarning($"Backlog {id} not found.");
                    throw new InvalidOperationException("Le backlog n'existe pas.");
                }

                var existingBacklog = await _context.Backlogs
                    .FirstOrDefaultAsync(b => b.ProjectId == backlog.ProjectId && b.Name == request.Name && b.Id != id);
                if (existingBacklog != null)
                {
                    _logger.LogWarning($"Backlog {request.Name} already exists for project {backlog.ProjectId}.");
                    throw new InvalidOperationException($"Un backlog avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                backlog.Name = request.Name;
                backlog.Description = request.Description;

                _context.Backlogs.Update(backlog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Backlog {id} updated.");
                return new BacklogDTO
                {
                    Id = backlog.Id,
                    Name = backlog.Name,
                    Description = backlog.Description,
                    ProjectId = backlog.ProjectId,
                    CreatedAt = backlog.CreatedAt,
                    TaskIds = backlog.TaskBacklogs?.Select(tb => tb.TaskId).ToList() ?? new List<int>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating backlog {id}");
                throw;
            }
        }

        public async Task<bool> DeleteBacklogAsync(int id)
        {
            try
            {
                var backlog = await _context.Backlogs
                    .Include(b => b.TaskBacklogs)
                    .FirstOrDefaultAsync(b => b.Id == id);
                if (backlog == null)
                {
                    _logger.LogWarning($"Backlog {id} not found.");
                    return false;
                }

                if (backlog.TaskBacklogs.Any())
                {
                    _logger.LogWarning($"Cannot delete backlog {backlog.Name} as it contains tasks.");
                    throw new InvalidOperationException("Impossible de supprimer le backlog car il contient des tâches.");
                }

                _context.Backlogs.Remove(backlog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Backlog {id} deleted.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting backlog {id}");
                throw;
            }
        }

        public async Task<bool> LinkTaskToBacklogAsync(int backlogId, int taskId)
        {
            try
            {
                var backlog = await _context.Backlogs.FindAsync(backlogId);
                var task = await _context.Tasks.FindAsync(taskId);

                if (backlog == null || task == null)
                {
                    _logger.LogWarning($"Backlog {backlogId} or Task {taskId} not found.");
                    throw new InvalidOperationException("Backlog ou tâche non trouvé.");
                }

                if (backlog.ProjectId != task.ProjectId)
                {
                    _logger.LogWarning($"Backlog {backlogId} and Task {taskId} belong to different projects.");
                    throw new InvalidOperationException("Le backlog et la tâche doivent appartenir au même projet.");
                }

                var existingLink = await _context.TaskBacklogs
                    .AnyAsync(tb => tb.BacklogId == backlogId && tb.TaskId == taskId);
                if (existingLink)
                {
                    _logger.LogWarning($"Task {taskId} is already linked to backlog {backlogId}.");
                    return false;
                }

                var taskBacklog = new TaskBacklog { TaskId = taskId, BacklogId = backlogId };
                _context.TaskBacklogs.Add(taskBacklog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {taskId} linked to backlog {backlogId}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error linking task {taskId} to backlog {backlogId}");
                throw;
            }
        }

        public async Task<bool> UnlinkTaskFromBacklogAsync(int backlogId, int taskId)
        {
            try
            {
                var taskBacklog = await _context.TaskBacklogs
                    .FirstOrDefaultAsync(tb => tb.BacklogId == backlogId && tb.TaskId == taskId);

                if (taskBacklog == null)
                {
                    _logger.LogWarning($"Task {taskId} is not linked to backlog {backlogId}.");
                    return false;
                }

                _context.TaskBacklogs.Remove(taskBacklog);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {taskId} unlinked from backlog {backlogId}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unlinking task {taskId} from backlog {backlogId}");
                throw;
            }
        }
    }
}