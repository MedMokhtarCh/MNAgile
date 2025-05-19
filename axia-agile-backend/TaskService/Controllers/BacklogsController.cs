using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.DTOs;
using TaskService.Services;

namespace TaskService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class BacklogsController : ControllerBase
    {
        private readonly BacklogService _backlogService;
        private readonly ILogger<BacklogsController> _logger;

        public BacklogsController(BacklogService backlogService, ILogger<BacklogsController> logger)
        {
            _backlogService = backlogService ?? throw new ArgumentNullException(nameof(backlogService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateBacklogs")]
        [ProducesResponseType(typeof(BacklogDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<BacklogDTO>> CreateBacklog([FromBody] CreateBacklogRequest request)
        {
            if (request == null)
            {
                _logger.LogWarning("CreateBacklog: Request data missing");
                return BadRequest("Les données du backlog sont requises.");
            }

            try
            {
                var backlog = await _backlogService.CreateBacklogAsync(request);
                _logger.LogInformation($"Backlog {backlog.Name} created for project {backlog.ProjectId}");
                return CreatedAtAction(nameof(GetBacklogById), new { id = backlog.Id }, backlog);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"CreateBacklog: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"CreateBacklog: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewBacklogs")]
        [ProducesResponseType(typeof(BacklogDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<BacklogDTO>> GetBacklogById(int id)
        {
            try
            {
                var backlog = await _backlogService.GetBacklogByIdAsync(id);
                if (backlog == null)
                {
                    _logger.LogWarning($"GetBacklogById: Backlog {id} not found");
                    return NotFound("Backlog non trouvé.");
                }
                return Ok(backlog);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetBacklogById: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("project/{projectId}")]
        
        [ProducesResponseType(typeof(List<BacklogDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<BacklogDTO>>> GetBacklogsByProject(int projectId)
        {
            try
            {
                var backlogs = await _backlogService.GetBacklogsByProjectAsync(projectId);
                _logger.LogInformation($"Retrieved {backlogs.Count} backlogs for project {projectId}");
                return Ok(backlogs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetBacklogsByProject: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanUpdateBacklogs")]
        [ProducesResponseType(typeof(BacklogDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<BacklogDTO>> UpdateBacklog(int id, [FromBody] UpdateBacklogRequest request)
        {
            try
            {
                var backlog = await _backlogService.UpdateBacklogAsync(id, request);
                _logger.LogInformation($"Backlog {id} updated");
                return Ok(backlog);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"UpdateBacklog: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateBacklog: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteBacklogs")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteBacklog(int id)
        {
            try
            {
                var success = await _backlogService.DeleteBacklogAsync(id);
                if (!success)
                {
                    _logger.LogWarning($"DeleteBacklog: Backlog {id} not found");
                    return NotFound("Backlog non trouvé.");
                }
                _logger.LogInformation($"Backlog {id} deleted");
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"DeleteBacklog: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteBacklog: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpPost("{backlogId}/tasks/{taskId}")]
       
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> LinkTaskToBacklog(int backlogId, int taskId)
        {
            try
            {
                var success = await _backlogService.LinkTaskToBacklogAsync(backlogId, taskId);
                if (!success)
                {
                    _logger.LogInformation($"Task {taskId} already linked to backlog {backlogId}.");
                    return Ok("Task already linked.");
                }
                _logger.LogInformation($"Task {taskId} linked to backlog {backlogId}.");
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"LinkTaskToBacklog: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"LinkTaskToBacklog: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpDelete("{backlogId}/tasks/{taskId}")]
      
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> UnlinkTaskFromBacklog(int backlogId, int taskId)
        {
            try
            {
                var success = await _backlogService.UnlinkTaskFromBacklogAsync(backlogId, taskId);
                if (!success)
                {
                    _logger.LogInformation($"Task {taskId} not linked to backlog {backlogId}.");
                    return NoContent();
                }
                _logger.LogInformation($"Task {taskId} unlinked from backlog {backlogId}.");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UnlinkTaskFromBacklog: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }
    }
}