
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskService.DTOs;
using TaskService.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;

namespace TaskService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly Services.TaskService _taskService;
        private readonly ILogger<TasksController> _logger;

        public TasksController(Services.TaskService taskService, ILogger<TasksController> logger)
        {
            _taskService = taskService ?? throw new ArgumentNullException(nameof(taskService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpPost]
        [Authorize(Policy = "CanCreateTasks")]
        [ProducesResponseType(typeof(TaskDTO), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TaskDTO>> CreateTask([FromForm] CreateTaskRequest request, [FromForm] List<IFormFile> attachments = null)
        {
            if (request == null)
            {
                _logger.LogWarning("CreateTask: Task data missing");
                return BadRequest("Task data is required.");
            }

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("CreateTask: Invalid or missing user ID in JWT claims");
                return Unauthorized("Invalid user authentication.");
            }

            try
            {
                var task = await _taskService.CreateTaskAsync(request, attachments ?? new List<IFormFile>(), userId);
                _logger.LogInformation($"Task {task.Title} created by user {userId} in project {task.ProjectId}");
                return CreatedAtAction(nameof(GetTaskById), new { id = task.Id }, task);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"CreateTask: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"CreateTask: Internal error - {ex.Message}");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewTasks")]
        [ProducesResponseType(typeof(TaskDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TaskDTO>> GetTaskById(int id)
        {
            try
            {
                var task = await _taskService.GetTaskByIdAsync(id);
                if (task == null)
                {
                    _logger.LogWarning($"GetTaskById: Task {id} not found");
                    return NotFound("Task not found.");
                }
                return Ok(task);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"GetTaskById: Internal error - {ex.Message}");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpGet]
        [Authorize(Policy = "CanViewTasks")]
        [ProducesResponseType(typeof(List<TaskDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<List<TaskDTO>>> GetAllTasks([FromQuery] int? projectId = null, [FromQuery] int? backlogId = null)
        {
            try
            {
                var tasks = await _taskService.GetAllTasksAsync(projectId, backlogId);
                _logger.LogInformation($"Retrieved {tasks.Count} tasks" + (projectId.HasValue ? $" for project {projectId}" : "") + (backlogId.HasValue ? $" for backlog {backlogId}" : ""));
                return Ok(tasks);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "GetAllTasks: Error retrieving tasks");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanUpdateTasks")]
        [ProducesResponseType(typeof(TaskDTO), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<TaskDTO>> UpdateTask(int id, [FromForm] UpdateTaskRequest request, [FromForm] List<IFormFile> attachments = null)
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("UpdateTask: Invalid or missing user ID in JWT claims");
                return Unauthorized("Invalid user authentication.");
            }

            try
            {
                var task = await _taskService.UpdateTaskAsync(id, request, attachments ?? new List<IFormFile>(), userId);
                if (task == null)
                {
                    _logger.LogWarning($"UpdateTask: Task {id} not found");
                    return NotFound("Task not found.");
                }
                _logger.LogInformation($"Task {id} updated by user {userId} in project {task.ProjectId}");
                return Ok(task);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, $"UpdateTask: Validation error - {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateTask: Internal error - {ex.Message}");
                return StatusCode(500, "An internal error occurred.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteTasks")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult> DeleteTask(int id)
        {
            try
            {
                var success = await _taskService.DeleteTaskAsync(id);
                if (!success)
                {
                    _logger.LogWarning($"DeleteTask: Task {id} not found");
                    return NotFound("Task not found.");
                }
                _logger.LogInformation($"Task {id} deleted");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteTask: Internal error - {ex.Message}");
                return StatusCode(500, "An internal error occurred.");
            }
        }
    }
}