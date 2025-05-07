using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.DTOs;
using ProjectService.Services;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System;

namespace ProjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly Services.ProjectService _projectService;
        private readonly ILogger<ProjectsController> _logger;

        public ProjectsController(Services.ProjectService projectService, ILogger<ProjectsController> logger)
        {
            _projectService = projectService ?? throw new ArgumentNullException(nameof(projectService));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        [HttpGet]
        [Authorize(Policy = "CanViewProjects")]
        [ProducesResponseType(typeof(List<ProjectDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<List<ProjectDto>>> GetAllProjects()
        {
            try
            {
                var projects = await _projectService.GetAllProjectsAsync();
                return Ok(projects);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all projects");
                return StatusCode(500, "Une erreur s'est produite lors de la récupération des projets.");
            }
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewProjects")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ProjectDto>> GetProjectById(int id)
        {
            try
            {
                var project = await _projectService.GetProjectByIdAsync(id);
                if (project == null)
                {
                    _logger.LogWarning($"Project {id} not found");
                    return NotFound("Projet non trouvé.");
                }
                return Ok(project);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error retrieving project {id}");
                return StatusCode(500, "Une erreur s'est produite lors de la récupération du projet.");
            }
        }

        [HttpPost]
        [Authorize(Policy = "CanAddProjects")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status201Created)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto createDto)
        {
            if (createDto == null)
            {
                _logger.LogWarning("CreateProject: Request body is null");
                return BadRequest("Les données du projet sont requises.");
            }

            try
            {
                // Retrieve JWT token from the authenticated context
                var token = Request.Cookies["AuthToken"];
                if (string.IsNullOrEmpty(token))
                {
                    _logger.LogWarning("CreateProject: No JWT token found in AuthToken cookie");
                    return StatusCode(401, "JWT token missing in AuthToken cookie.");
                }

                var createdProject = await _projectService.CreateProjectAsync(createDto, token);
                _logger.LogInformation($"Project {createdProject.Title} (ID: {createdProject.Id}) created");
                return CreatedAtAction(nameof(GetProjectById), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CreateProject: Error creating project");
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanEditProjects")]
        [ProducesResponseType(typeof(ProjectDto), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult<ProjectDto>> UpdateProject(int id, [FromBody] UpdateProjectDto updateDto)
        {
            if (id != updateDto.Id)
            {
                _logger.LogWarning($"UpdateProject: ID mismatch (Route: {id}, Body: {updateDto.Id})");
                return BadRequest("ID du projet non valide.");
            }

            try
            {
                var updatedProject = await _projectService.UpdateProjectAsync(updateDto);
                _logger.LogInformation($"Project {updatedProject.Title} (ID: {id}) updated");
                return Ok(updatedProject);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"UpdateProject: Error updating project {id}");
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteProjects")]
        [ProducesResponseType(StatusCodes.Status204NoContent)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status401Unauthorized)]
        public async Task<ActionResult> DeleteProject(int id)
        {
            try
            {
                await _projectService.DeleteProjectAsync(id);
                _logger.LogInformation($"Project ID {id} deleted");
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"DeleteProject: Error deleting project {id}");
                return BadRequest(ex.Message);
            }
        }
    }
}