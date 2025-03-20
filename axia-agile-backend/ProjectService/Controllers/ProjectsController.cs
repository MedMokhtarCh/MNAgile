using Microsoft.AspNetCore.Mvc;
using ProjectService.Models;
using ProjectService.Services;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly Services.ProjectService _projectService;

        public ProjectsController(Services.ProjectService projectService)
        {
            _projectService = projectService;
        }

        // Récupérer tous les projets
        [HttpGet]
        public async Task<ActionResult<List<Project>>> GetAllProjects()
        {
            var projects = await _projectService.GetAllProjectsAsync();
            return Ok(projects);
        }

        // Récupérer un projet par son ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Project>> GetProjectById(int id)
        {
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound("Projet non trouvé.");
            }
            return Ok(project);
        }

        // Créer un nouveau projet
        [HttpPost]
        public async Task<ActionResult<Project>> CreateProject([FromBody] Project project)
        {
            if (project == null)
            {
                return BadRequest("Les données du projet sont requises.");
            }

            try
            {
                var createdProject = await _projectService.CreateProjectAsync(project);
                return CreatedAtAction(nameof(GetProjectById), new { id = createdProject.Id }, createdProject);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Mettre à jour un projet existant
        [HttpPut("{id}")]
        public async Task<ActionResult<Project>> UpdateProject(int id, [FromBody] Project project)
        {
            if (id != project.Id)
            {
                return BadRequest("ID du projet non valide.");
            }

            try
            {
                var updatedProject = await _projectService.UpdateProjectAsync(project);
                return Ok(updatedProject);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Supprimer un projet par son ID
        [HttpDelete("{id}")]
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