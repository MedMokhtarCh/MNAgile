using Microsoft.EntityFrameworkCore;
using ProjectService.Data;
using ProjectService.DTOs;
using ProjectService.Models;

namespace ProjectService.Services
{
    public class ProjectService
    {
        private readonly AppDbContext _context;
        private readonly UserServiceClient _userServiceClient;

        public ProjectService(AppDbContext context, UserServiceClient userServiceClient)
        {
            _context = context;
            _userServiceClient = userServiceClient;
        }

        public async Task<List<ProjectDto>> GetAllProjectsAsync()
        {
            var projects = await _context.Projects.ToListAsync();
            return projects.Select(p => MapToDto(p)).ToList();
        }

        public async Task<ProjectDto> GetProjectByIdAsync(int id)
        {
            var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
            return project != null ? MapToDto(project) : null;
        }

        public async Task<ProjectDto> CreateProjectAsync(CreateProjectDto createDto)
        {
            if (!await _userServiceClient.UserExistsAsync(createDto.CreatedBy))
                throw new Exception("L'utilisateur qui crée le projet n'existe pas.");

            foreach (var pm in createDto.ProjectManagers)
                if (!await _userServiceClient.UserExistsAsync(pm))
                    throw new Exception($"Le gestionnaire de projet {pm} n'existe pas.");

            foreach (var po in createDto.ProductOwners)
                if (!await _userServiceClient.UserExistsAsync(po))
                    throw new Exception($"Le Product Owner {po} n'existe pas.");

            foreach (var sm in createDto.ScrumMasters)
                if (!await _userServiceClient.UserExistsAsync(sm))
                    throw new Exception($"Le Scrum Master {sm} n'existe pas.");

            foreach (var dev in createDto.Developers)
                if (!await _userServiceClient.UserExistsAsync(dev))
                    throw new Exception($"Le développeur {dev} n'existe pas.");

            foreach (var tester in createDto.Testers)
                if (!await _userServiceClient.UserExistsAsync(tester))
                    throw new Exception($"Le testeur {tester} n'existe pas.");

            foreach (var observer in createDto.Observers)
                if (!await _userServiceClient.UserExistsAsync(observer))
                    throw new Exception($"L'observateur {observer} n'existe pas.");

            var project = new Project
            {
                Title = createDto.Title,
                Description = createDto.Description,
                StartDate = createDto.StartDate,
                EndDate = createDto.EndDate,
                Methodology = createDto.Methodology,
                CreatedBy = createDto.CreatedBy,
                ProjectManagers = createDto.ProjectManagers,
                ProductOwners = createDto.ProductOwners,
                ScrumMasters = createDto.ScrumMasters,
                Developers = createDto.Developers,
                Testers = createDto.Testers,
                Observers = createDto.Observers,
                CreatedAt = DateTime.UtcNow
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return MapToDto(project);
        }

        public async Task<ProjectDto> UpdateProjectAsync(UpdateProjectDto updateDto)
        {
            var project = await _context.Projects.FindAsync(updateDto.Id);
            if (project == null)
                throw new Exception("Projet non trouvé.");

            // Update only provided fields
            if (updateDto.Title != null)
                project.Title = updateDto.Title;

            if (updateDto.Description != null)
                project.Description = updateDto.Description;

            if (updateDto.StartDate.HasValue)
                project.StartDate = updateDto.StartDate.Value;

            if (updateDto.EndDate.HasValue)
                project.EndDate = updateDto.EndDate.Value;

            if (updateDto.Methodology != null)
                project.Methodology = updateDto.Methodology;

            if (updateDto.ProjectManagers != null)
            {
                foreach (var pm in updateDto.ProjectManagers)
                    if (!await _userServiceClient.UserExistsAsync(pm))
                        throw new Exception($"Le gestionnaire de projet {pm} n'existe pas.");
                project.ProjectManagers = updateDto.ProjectManagers;
            }

            if (updateDto.ProductOwners != null)
            {
                foreach (var po in updateDto.ProductOwners)
                    if (!await _userServiceClient.UserExistsAsync(po))
                        throw new Exception($"Le Product Owner {po} n'existe pas.");
                project.ProductOwners = updateDto.ProductOwners;
            }

            if (updateDto.ScrumMasters != null)
            {
                foreach (var sm in updateDto.ScrumMasters)
                    if (!await _userServiceClient.UserExistsAsync(sm))
                        throw new Exception($"Le Scrum Master {sm} n'existe pas.");
                project.ScrumMasters = updateDto.ScrumMasters;
            }

            if (updateDto.Developers != null)
            {
                foreach (var dev in updateDto.Developers)
                    if (!await _userServiceClient.UserExistsAsync(dev))
                        throw new Exception($"Le développeur {dev} n'existe pas.");
                project.Developers = updateDto.Developers;
            }

            if (updateDto.Testers != null)
            {
                foreach (var tester in updateDto.Testers)
                    if (!await _userServiceClient.UserExistsAsync(tester))
                        throw new Exception($"Le testeur {tester} n'existe pas.");
                project.Testers = updateDto.Testers;
            }

            if (updateDto.Observers != null)
            {
                foreach (var observer in updateDto.Observers)
                    if (!await _userServiceClient.UserExistsAsync(observer))
                        throw new Exception($"L'observateur {observer} n'existe pas.");
                project.Observers = updateDto.Observers;
            }

            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
            return MapToDto(project);
        }

        public async Task DeleteProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project != null)
            {
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
            }
        }

        private ProjectDto MapToDto(Project project)
        {
            return new ProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                CreatedAt = project.CreatedAt,
                StartDate = project.StartDate,
                EndDate = project.EndDate,
                Methodology = project.Methodology,
                CreatedBy = project.CreatedBy,
                ProjectManagers = project.ProjectManagers,
                ProductOwners = project.ProductOwners,
                ScrumMasters = project.ScrumMasters,
                Developers = project.Developers,
                Testers = project.Testers,
                Observers = project.Observers
            };
        }
    }
}