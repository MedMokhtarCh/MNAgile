using Microsoft.EntityFrameworkCore;
using TaskService.Data;
using TaskService.DTOs;
using TaskService.Models;

namespace TaskService.Services
{
    public class SprintService
    {
        private readonly AppDbContext _context;
        private readonly ProjectServiceClient _projectServiceClient;
        private readonly ILogger<SprintService> _logger;

        public SprintService(
            AppDbContext context,
            ProjectServiceClient projectServiceClient,
            ILogger<SprintService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _projectServiceClient = projectServiceClient ?? throw new ArgumentNullException(nameof(projectServiceClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<SprintDTO> CreateSprintAsync(CreateSprintRequest request)
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

                var existingSprint = await _context.Sprints
                    .FirstOrDefaultAsync(s => s.ProjectId == request.ProjectId && s.Name == request.Name);
                if (existingSprint != null)
                {
                    _logger.LogWarning($"Sprint {request.Name} already exists for project {request.ProjectId}.");
                    throw new InvalidOperationException($"Un sprint avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                var sprint = new Sprint
                {
                    Name = request.Name,
                    Description = request.Description,
                    ProjectId = request.ProjectId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    IsActive = request.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Sprints.Add(sprint);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Sprint {sprint.Name} created for project {sprint.ProjectId}.");
                return new SprintDTO
                {
                    Id = sprint.Id,
                    Name = sprint.Name,
                    Description = sprint.Description,
                    ProjectId = sprint.ProjectId,
                    StartDate = sprint.StartDate,
                    EndDate = sprint.EndDate,
                    IsActive = sprint.IsActive,
                    CreatedAt = sprint.CreatedAt,
                    TaskIds = new List<int>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating sprint: {ex.Message}");
                throw;
            }
        }

        public async Task<SprintDTO> GetSprintByIdAsync(int id)
        {
            try
            {
                var sprint = await _context.Sprints
                    .Include(s => s.Tasks)
                    .FirstOrDefaultAsync(s => s.Id == id);

                if (sprint == null)
                {
                    _logger.LogWarning($"Sprint {id} not found.");
                    return null;
                }

                return new SprintDTO
                {
                    Id = sprint.Id,
                    Name = sprint.Name,
                    Description = sprint.Description,
                    ProjectId = sprint.ProjectId,
                    StartDate = sprint.StartDate,
                    EndDate = sprint.EndDate,
                    IsActive = sprint.IsActive,
                    CreatedAt = sprint.CreatedAt,
                    TaskIds = sprint.Tasks.Select(t => t.Id).ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving sprint {id}");
                throw;
            }
        }

        public async Task<List<SprintDTO>> GetSprintsByProjectAsync(int projectId)
        {
            try
            {
                var sprints = await _context.Sprints
                    .Where(s => s.ProjectId == projectId)
                    .Include(s => s.Tasks)
                    .Select(s => new SprintDTO
                    {
                        Id = s.Id,
                        Name = s.Name,
                        Description = s.Description,
                        ProjectId = s.ProjectId,
                        StartDate = s.StartDate,
                        EndDate = s.EndDate,
                        IsActive = s.IsActive,
                        CreatedAt = s.CreatedAt,
                        TaskIds = s.Tasks.Select(t => t.Id).ToList()
                    })
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {sprints.Count} sprints for project {projectId}.");
                return sprints;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving sprints for project {projectId}");
                throw;
            }
        }

        public async Task<SprintDTO> UpdateSprintAsync(int id, UpdateSprintRequest request)
        {
            try
            {
                request.Validate();

                var sprint = await _context.Sprints.FindAsync(id);
                if (sprint == null)
                {
                    _logger.LogWarning($"Sprint {id} not found.");
                    throw new InvalidOperationException("Le sprint n'existe pas.");
                }

                var existingSprint = await _context.Sprints
                    .FirstOrDefaultAsync(s => s.ProjectId == sprint.ProjectId && s.Name == request.Name && s.Id != id);
                if (existingSprint != null)
                {
                    _logger.LogWarning($"Sprint {request.Name} already exists for project {sprint.ProjectId}.");
                    throw new InvalidOperationException($"Un sprint avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                sprint.Name = request.Name;
                sprint.Description = request.Description ?? sprint.Description;
                sprint.StartDate = request.StartDate ?? sprint.StartDate;
                sprint.EndDate = request.EndDate ?? sprint.EndDate;
                sprint.IsActive = request.IsActive ?? sprint.IsActive;

                _context.Sprints.Update(sprint);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Sprint {id} updated.");
                return new SprintDTO
                {
                    Id = sprint.Id,
                    Name = sprint.Name,
                    Description = sprint.Description,
                    ProjectId = sprint.ProjectId,
                    StartDate = sprint.StartDate,
                    EndDate = sprint.EndDate,
                    IsActive = sprint.IsActive,
                    CreatedAt = sprint.CreatedAt,
                    TaskIds = sprint.Tasks?.Select(t => t.Id).ToList() ?? new List<int>()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating sprint {id}");
                throw;
            }
        }

        public async Task<bool> DeleteSprintAsync(int id)
        {
            try
            {
                var sprint = await _context.Sprints
                    .Include(s => s.Tasks)
                    .FirstOrDefaultAsync(s => s.Id == id);
                if (sprint == null)
                {
                    _logger.LogWarning($"Sprint {id} not found.");
                    return false;
                }

                if (sprint.Tasks.Any())
                {
                    _logger.LogWarning($"Cannot delete sprint {sprint.Name} as it contains tasks.");
                    throw new InvalidOperationException("Impossible de supprimer le sprint car il contient des tâches.");
                }

                _context.Sprints.Remove(sprint);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Sprint {id} deleted.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting sprint {id}");
                throw;
            }
        }

        public async Task<bool> LinkTaskToSprintAsync(int sprintId, int taskId)
        {
            try
            {
                var sprint = await _context.Sprints.FindAsync(sprintId);
                var task = await _context.Tasks.FindAsync(taskId);

                if (sprint == null || task == null)
                {
                    _logger.LogWarning($"Sprint {sprintId} or Task {taskId} not found.");
                    throw new InvalidOperationException("Sprint ou tâche non trouvé.");
                }

                if (sprint.ProjectId != task.ProjectId)
                {
                    _logger.LogWarning($"Sprint {sprintId} and Task {taskId} belong to different projects.");
                    throw new InvalidOperationException("Le sprint et la tâche doivent appartenir au même projet.");
                }

                if (task.SprintId == sprintId)
                {
                    _logger.LogWarning($"Task {taskId} is already linked to sprint {sprintId}.");
                    return false;
                }

                task.SprintId = sprintId;
                _context.Tasks.Update(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {taskId} linked to sprint {sprintId}.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error linking task {taskId} to sprint {sprintId}");
                throw;
            }
        }

        public async Task<bool> UnlinkTaskFromSprintAsync(int taskId)
        {
            try
            {
                var task = await _context.Tasks.FindAsync(taskId);
                if (task == null)
                {
                    _logger.LogWarning($"Task {taskId} not found.");
                    return false;
                }

                if (!task.SprintId.HasValue)
                {
                    _logger.LogWarning($"Task {taskId} is not linked to any sprint.");
                    return false;
                }

                task.SprintId = null;
                _context.Tasks.Update(task);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Task {taskId} unlinked from sprint.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error unlinking task {taskId} from sprint");
                throw;
            }
        }
    }
}