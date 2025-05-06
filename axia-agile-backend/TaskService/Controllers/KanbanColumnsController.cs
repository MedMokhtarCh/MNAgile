using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskService.DTOs;
using TaskService.Services;
using Microsoft.AspNetCore.Http;

namespace TaskService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class KanbanColumnsController : ControllerBase
    {
        private readonly KanbanColumnService _kanbanColumnService;
        private readonly ILogger<KanbanColumnsController> _logger;

        public KanbanColumnsController(KanbanColumnService kanbanColumnService, ILogger<KanbanColumnsController> logger)
        {
            _kanbanColumnService = kanbanColumnService ?? throw new ArgumentNullException(nameof(kanbanColumnService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateTasks")]
        [ProducesResponseType(typeof(KanbanColumnDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<KanbanColumnDTO>> CreateColumn([FromBody] CreateKanbanColumnRequest request)
        {
            if (request == null)
            {
                _logger.LogWarning("CreateColumn: Request data missing");
                return BadRequest("Les données de la colonne sont requises.");
            }

            try
            {
                var column = await _kanbanColumnService.CreateColumnAsync(request);
                _logger.LogInformation($"Kanban column {column.Name} created for project {column.ProjectId}");
                return CreatedAtAction(nameof(GetColumnById), new { id = column.Id }, column);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"CreateColumn: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"CreateColumn: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewTasks")]
        [ProducesResponseType(typeof(KanbanColumnDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<KanbanColumnDTO>> GetColumnById(int id)
        {
            try
            {
                var column = await _kanbanColumnService.GetColumnsByProjectAsync(id);
                if (!column.Any())
                {
                    _logger.LogWarning($"GetColumnById: Column {id} not found");
                    return NotFound("Colonne non trouvée.");
                }
                return Ok(column.First());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetColumnById: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("project/{projectId}")]
        [Authorize(Policy = "CanViewTasks")]
        [ProducesResponseType(typeof(List<KanbanColumnDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<KanbanColumnDTO>>> GetColumnsByProject(int projectId)
        {
            try
            {
                var columns = await _kanbanColumnService.GetColumnsByProjectAsync(projectId);
                _logger.LogInformation($"Retrieved {columns.Count} columns for project {projectId}");
                return Ok(columns);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetColumnsByProject: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanUpdateTasks")]
        [ProducesResponseType(typeof(KanbanColumnDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<KanbanColumnDTO>> UpdateColumn(int id, [FromBody] UpdateKanbanColumnRequest request)
        {
            try
            {
                var column = await _kanbanColumnService.UpdateColumnAsync(id, request);
                _logger.LogInformation($"Kanban column {id} updated");
                return Ok(column);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"UpdateColumn: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateColumn: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteTasks")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteColumn(int id)
        {
            try
            {
                var success = await _kanbanColumnService.DeleteColumnAsync(id);
                if (!success)
                {
                    _logger.LogWarning($"DeleteColumn: Column {id} not found");
                    return NotFound("Colonne non trouvée.");
                }
                _logger.LogInformation($"Kanban column {id} deleted");
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"DeleteColumn: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteColumn: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }
    }
}