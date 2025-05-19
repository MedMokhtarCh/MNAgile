using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskService.DTOs;
using TaskService.Services;

namespace TaskService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SprintsController : ControllerBase
    {
        private readonly SprintService _sprintService;
        private readonly ILogger<SprintsController> _logger;

        public SprintsController(SprintService sprintService, ILogger<SprintsController> logger)
        {
            _sprintService = sprintService ?? throw new ArgumentNullException(nameof(sprintService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateSprints")]
        [ProducesResponseType(typeof(SprintDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<SprintDTO>> CreateSprint([FromBody] CreateSprintRequest request)
        {
            if (request == null)
            {
                _logger.LogWarning("CreateSprint: Request data missing");
                return BadRequest("Les données du sprint sont requises.");
            }

            try
            {
                var sprint = await _sprintService.CreateSprintAsync(request);
                _logger.LogInformation($"Sprint {sprint.Name} created for project {sprint.ProjectId}");
                return CreatedAtAction(nameof(GetSprintById), new { id = sprint.Id }, sprint);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"CreateSprint: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"CreateSprint: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewSprints")]

        [ProducesResponseType(typeof(SprintDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<SprintDTO>> GetSprintById(int id)
        {
            try
            {
                var sprint = await _sprintService.GetSprintByIdAsync(id);
                if (sprint == null)
                {
                    _logger.LogWarning($"GetSprintById: Sprint {id} not found");
                    return NotFound("Sprint non trouvé.");
                }
                return Ok(sprint);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetSprintById: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpGet("project/{projectId}")]
        [Authorize(Policy = "CanViewSprints")]

        [ProducesResponseType(typeof(List<SprintDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<SprintDTO>>> GetSprintsByProject(int projectId)
        {
            try
            {
                var sprints = await _sprintService.GetSprintsByProjectAsync(projectId);
                _logger.LogInformation($"Retrieved {sprints.Count} sprints for project {projectId}");
                return Ok(sprints);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetSprintsByProject: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanUpdateSprints")]

        [ProducesResponseType(typeof(SprintDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<SprintDTO>> UpdateSprint(int id, [FromBody] UpdateSprintRequest request)
        {
            try
            {
                var sprint = await _sprintService.UpdateSprintAsync(id, request);
                _logger.LogInformation($"Sprint {id} updated");
                return Ok(sprint);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"UpdateSprint: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateSprint: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteSprints")]

        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteSprint(int id)
        {
            try
            {
                var success = await _sprintService.DeleteSprintAsync(id);
                if (!success)
                {
                    _logger.LogWarning($"DeleteSprint: Sprint {id} not found");
                    return NotFound("Sprint non trouvé.");
                }
                _logger.LogInformation($"Sprint {id} deleted");
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"DeleteSprint: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteSprint: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpPost("{sprintId}/tasks/{taskId}")]
   
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> LinkTaskToSprint(int sprintId, int taskId)
        {
            try
            {
                var success = await _sprintService.LinkTaskToSprintAsync(sprintId, taskId);
                if (!success)
                {
                    _logger.LogInformation($"Task {taskId} already linked to sprint {sprintId}.");
                    return Ok("Task already linked.");
                }
                _logger.LogInformation($"Task {taskId} linked to sprint {sprintId}.");
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"LinkTaskToSprint: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"LinkTaskToSprint: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }

        [HttpDelete("{sprintId}/tasks/{taskId}")]
     
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> UnlinkTaskFromSprint(int sprintId, int taskId)
        {
            try
            {
                var success = await _sprintService.UnlinkTaskFromSprintAsync(taskId);
                if (!success)
                {
                    _logger.LogInformation($"Task {taskId} not linked to sprint {sprintId}.");
                    return NoContent();
                }
                _logger.LogInformation($"Task {taskId} unlinked from sprint {sprintId}.");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UnlinkTaskFromSprint: Internal error - {ex.Message}");
                return StatusCode(500, "Une erreur interne s'est produite.");
            }
        }
    }
}