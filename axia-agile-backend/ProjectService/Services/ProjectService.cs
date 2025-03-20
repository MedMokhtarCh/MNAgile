
using Microsoft.EntityFrameworkCore;
using global::ProjectService.Models;
using global::ProjectService.Data;

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

        // Récupérer tous les projets
        public async Task<List<Project>> GetAllProjectsAsync()
        {
            return await _context.Projects.ToListAsync();
        }

        // Récupérer un projet par son ID
        public async Task<Project> GetProjectByIdAsync(int id)
        {
            return await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
        }

        // Créer un nouveau projet
        public async Task<Project> CreateProjectAsync(Project project)
        {
            // Vérifier si l'utilisateur qui crée le projet existe
            if (!await _userServiceClient.UserExistsAsync(project.CreatedBy))
            {
                throw new Exception("L'utilisateur qui crée le projet n'existe pas.");
            }

            
            if (!await _userServiceClient.UserExistsAsync(project.ProductOwner))
            {
                throw new Exception("Le Product Owner n'existe pas.");
            }

            
            if (!await _userServiceClient.UserExistsAsync(project.ScrumMaster))
            {
                throw new Exception("Le Scrum Master n'existe pas.");
            }

           
            foreach (var developer in project.Developers)
            {
                if (!await _userServiceClient.UserExistsAsync(developer))
                {
                    throw new Exception($"Le développeur {developer} n'existe pas.");
                }
            }

            
            foreach (var tester in project.Testers)
            {
                if (!await _userServiceClient.UserExistsAsync(tester))
                {
                    throw new Exception($"Le testeur {tester} n'existe pas.");
                }
            }

            project.CreatedAt = DateTime.UtcNow;
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
            return project;
        }

        // Mettre à jour un projet existant
        public async Task<Project> UpdateProjectAsync(Project project)
        {
            _context.Projects.Update(project);
            await _context.SaveChangesAsync();
            return project;
        }

        // Supprimer un projet par son ID
        public async Task DeleteProjectAsync(int id)
        {
            var project = await _context.Projects.FindAsync(id);
            if (project != null)
            {
                _context.Projects.Remove(project);
                await _context.SaveChangesAsync();
            }
        }
    }
}