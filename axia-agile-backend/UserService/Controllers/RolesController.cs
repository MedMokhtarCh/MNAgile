using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.DTOs;
using UserService.Models;

namespace UserService.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
  
    public class RolesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<RolesController> _logger;

        public RolesController(AppDbContext context, ILogger<RolesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Role>>> GetRoles()
        {
            try
            {
                var roles = await _context.Roles.ToListAsync();
                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch roles");
                return StatusCode(500, new { message = "Failed to fetch roles", error = ex.Message });
            }
        }
        [HttpPost]
        public async Task<ActionResult<Role>> CreateRole([FromBody] CreateRoleRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Invalid role creation request: Name is empty.");
                return BadRequest("Le nom du rôle est requis.");
            }

            if (await _context.Roles.AnyAsync(r => r.Name == request.Name))
            {
                _logger.LogWarning("Role with name {Name} already exists.", request.Name);
                return BadRequest("Un rôle avec ce nom existe déjà.");
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    // Find the smallest available ID
                    int newId = 1;
                    var existingIds = await _context.Roles
                        .Select(r => r.Id)
                        .OrderBy(id => id)
                        .ToListAsync();

                    while (existingIds.Contains(newId))
                    {
                        newId++;
                    }

                    var role = new Role
                    {
                        Id = newId, // Assign the smallest available ID
                        Name = request.Name
                    };

                    _context.Roles.Add(role);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    _logger.LogInformation("Role {Name} created successfully with ID {Id}.", role.Name, role.Id);

                    return CreatedAtAction(nameof(GetRoles), new { id = role.Id }, role);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating role {Name}", request.Name);
                    return StatusCode(500, new { message = "Une erreur est survenue lors de la création du rôle.", error = ex.Message });
                }
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Role>> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Invalid role update request: Name is empty.");
                return BadRequest("Le nom du rôle est requis.");
            }

            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                _logger.LogWarning("Role with ID {Id} not found.", id);
                return NotFound("Rôle non trouvé.");
            }

            if (await _context.Roles.AnyAsync(r => r.Name == request.Name && r.Id != id))
            {
                _logger.LogWarning("Role with name {Name} already exists.", request.Name);
                return BadRequest("Un rôle avec ce nom existe déjà.");
            }

            try
            {
                role.Name = request.Name;

                _context.Roles.Update(role);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Role {Name} updated successfully.", role.Name);

                return Ok(role);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating role {Name}", request.Name);
                return StatusCode(500, new { message = "Une erreur est survenue lors de la mise à jour du rôle.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                _logger.LogWarning("Role with ID {Id} not found.", id);
                return NotFound("Rôle non trouvé.");
            }

            // Prevent deletion of SuperAdmin role
            if (role.Id == 1)
            {
                _logger.LogWarning("Attempted to delete SuperAdmin role.");
                return BadRequest("Le rôle SuperAdmin ne peut pas être supprimé.");
            }

            try
            {
                var associatedUsers = await _context.Users.Where(u => u.RoleId == id).ToListAsync();
                if (associatedUsers.Any())
                {
                    var defaultRole = await _context.Roles.FindAsync(4);
                    if (defaultRole == null)
                    {
                        _logger.LogWarning("Default User role not found.");
                        return BadRequest("Rôle par défaut 'User' non trouvé. Impossible de supprimer le rôle.");
                    }

                    foreach (var user in associatedUsers)
                    {
                        user.RoleId = 4; 
                    }
                    _context.Users.UpdateRange(associatedUsers);
                }

                _context.Roles.Remove(role);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Role {Name} deleted successfully.", role.Name);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting role {Name}", role.Name);
                return StatusCode(500, new { message = "Une erreur est survenue lors de la suppression du rôle.", error = ex.Message });
            }
        }
    }
}