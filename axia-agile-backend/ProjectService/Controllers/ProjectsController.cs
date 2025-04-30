using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectService.DTOs;
using ProjectService.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController : ControllerBase
    {
        private readonly Services.ProjectService _projectService;

        public ProjectsController(Services.ProjectService projectService)
        {
            _projectService = projectService;
        }

        [HttpGet]
        [Authorize(Policy = "CanViewProjects")]
        public async Task<ActionResult<List<ProjectDto>>> GetAllProjects()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "CanViewProjects")]
        public async Task<ActionResult<ProjectDto>> GetProjectById(int id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound("Projet non trouvé.");
            }
            return Ok(project);
        }

        [HttpPost]
        [Authorize(Policy = "CanAddProjects")]
        public async Task<ActionResult<ProjectDto>> CreateProject([FromBody] CreateProjectDto createDto)
        {
            if (createDto == null)
            {
                return BadRequest("Les données du projet sont requises.");
            }

            try
            {
                var createdProject = await _projectService.CreateProjectAsync(createDto);
                return CreatedAtAction(nameof(GetProjectById), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "CanEditProjects")]
        public async Task<ActionResult<ProjectDto>> UpdateProject(int id, [FromBody] UpdateProjectDto updateDto)
        {
            if (id != updateDto.Id)
            {
                return BadRequest("ID du projet non valide.");
            }

            try
            {
                var updatedProject = await _projectService.UpdateProjectAsync(updateDto);
                return Ok(updatedProject);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "CanDeleteProjects")]
        public async Task<ActionResult> DeleteProject(int id)
        {
            try
            {
                await _projectService.DeleteProjectAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}