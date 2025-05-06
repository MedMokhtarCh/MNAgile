using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using TaskService.Data;
using TaskService.DTOs;
using TaskService.Models;
using TaskService.Services;

namespace TaskService.Services
{
    public class KanbanColumnService
    {
        private readonly AppDbContext _context;
        private readonly ProjectServiceClient _projectServiceClient;
        private readonly ILogger<KanbanColumnService> _logger;

        public KanbanColumnService(
            AppDbContext context,
            ProjectServiceClient projectServiceClient,
            ILogger<KanbanColumnService> logger)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
            _projectServiceClient = projectServiceClient ?? throw new ArgumentNullException(nameof(projectServiceClient));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<KanbanColumnDTO> CreateColumnAsync(CreateKanbanColumnRequest request)
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

                var existingColumn = await _context.KanbanColumns
                    .FirstOrDefaultAsync(c => c.ProjectId == request.ProjectId && c.Name == request.Name);
                if (existingColumn != null)
                {
                    _logger.LogWarning($"Column {request.Name} already exists for project {request.ProjectId}.");
                    throw new InvalidOperationException($"Une colonne avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                var column = new KanbanColumn
                {
                    Name = request.Name,
                    ProjectId = request.ProjectId,
                    DisplayOrder = request.DisplayOrder,
                    CreatedAt = DateTime.UtcNow
                };

                _context.KanbanColumns.Add(column);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Kanban column {column.Name} created for project {column.ProjectId}.");
                return new KanbanColumnDTO
                {
                    Id = column.Id,
                    Name = column.Name,
                    ProjectId = column.ProjectId,
                    DisplayOrder = column.DisplayOrder,
                    CreatedAt = column.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating Kanban column: {ex.Message}");
                throw;
            }
        }

        public async Task<List<KanbanColumnDTO>> GetColumnsByProjectAsync(int projectId)
        {
            try
            {
                var columns = await _context.KanbanColumns
                    .Where(c => c.ProjectId == projectId)
                    .OrderBy(c => c.DisplayOrder)
                    .Select(c => new KanbanColumnDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        ProjectId = c.ProjectId,
                        DisplayOrder = c.DisplayOrder,
                        CreatedAt = c.CreatedAt
                    })
                    .ToListAsync();

                _logger.LogInformation($"Retrieved {columns.Count} Kanban columns for project {projectId}.");
                return columns;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving Kanban columns for project {projectId}");
                throw;
            }
        }

        public async Task<KanbanColumnDTO> UpdateColumnAsync(int id, UpdateKanbanColumnRequest request)
        {
            try
            {
                request.Validate();

                var column = await _context.KanbanColumns.FindAsync(id);
                if (column == null)
                {
                    _logger.LogWarning($"Kanban column {id} not found.");
                    throw new InvalidOperationException("La colonne n'existe pas.");
                }

                var existingColumn = await _context.KanbanColumns
                    .FirstOrDefaultAsync(c => c.ProjectId == column.ProjectId && c.Name == request.Name && c.Id != id);
                if (existingColumn != null)
                {
                    _logger.LogWarning($"Column {request.Name} already exists for project {column.ProjectId}.");
                    throw new InvalidOperationException($"Une colonne avec le nom '{request.Name}' existe déjà pour ce projet.");
                }

                column.Name = request.Name;
                if (request.DisplayOrder.HasValue)
                    column.DisplayOrder = request.DisplayOrder.Value;

                _context.KanbanColumns.Update(column);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Kanban column {id} updated.");
                return new KanbanColumnDTO
                {
                    Id = column.Id,
                    Name = column.Name,
                    ProjectId = column.ProjectId,
                    DisplayOrder = column.DisplayOrder,
                    CreatedAt = column.CreatedAt
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating Kanban column {id}");
                throw;
            }
        }

        public async Task<bool> DeleteColumnAsync(int id)
        {
            try
            {
                var column = await _context.KanbanColumns.FindAsync(id);
                if (column == null)
                {
                    _logger.LogWarning($"Kanban column {id} not found.");
                    return false;
                }

                // Check if there are tasks associated with this column
                var tasksInColumn = await _context.Tasks
                    .AnyAsync(t => t.ProjectId == column.ProjectId && t.Status == column.Name);
                if (tasksInColumn)
                {
                    _logger.LogWarning($"Cannot delete column {column.Name} as it contains tasks.");
                    throw new InvalidOperationException("Impossible de supprimer la colonne car elle contient des tâches.");
                }

                _context.KanbanColumns.Remove(column);
                await _context.SaveChangesAsync();

                _logger.LogInformation($"Kanban column {id} deleted.");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting Kanban column {id}");
                throw;
            }
        }
    }
}