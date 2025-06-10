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
                return StatusCode(500, new { message = "Échec de la récupération des rôles", error = ex.Message });
            }
        }

        [HttpGet("createdBy/{userId}")]
        public async Task<ActionResult<IEnumerable<Role>>> GetRolesByUserId(int userId)
        {
            try
            {
                var roles = await _context.Roles
                    .Where(r => r.CreatedByUserId == userId)
                    .ToListAsync();

                if (!roles.Any())
                {
                    _logger.LogInformation("No roles found for user ID {UserId}.", userId);
                    return NotFound("Aucun rôle trouvé pour cet utilisateur.");
                }

                return Ok(roles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch roles for user ID {UserId}", userId);
                return StatusCode(500, new { message = "Une erreur est survenue lors de la récupération des rôles.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<Role>> CreateRole([FromBody] CreateRoleRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Invalid role creation request: Name is empty.");
                return BadRequest(new { message = "Le nom du rôle est requis." });
            }

            // Check if the role name matches any default role names (IDs 1, 2, 3, 4)
            var defaultRoles = await _context.Roles
                .Where(r => new[] { 1, 2, 3, 4 }.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync();

            if (defaultRoles.Any(dr => dr.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
            {
                _logger.LogWarning("Attempted to create role with name {Name} that matches a default role.", request.Name);
                return BadRequest(new { message = "Un rôle avec ce nom existe déjà." });
            }

            // Check for duplicate names among roles created by the same user
            if (await _context.Roles.AnyAsync(r => r.Name == request.Name && r.CreatedByUserId == request.CreatedByUserId))
            {
                _logger.LogWarning("Role with name {Name} already exists for user {UserId}.", request.Name, request.CreatedByUserId);
                return BadRequest(new { message = "Un rôle avec ce nom existe déjà." });
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
                        Id = newId,
                        Name = request.Name,
                        CreatedByUserId = request.CreatedByUserId
                    };

                    _context.Roles.Add(role);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    _logger.LogInformation("Role {Name} created successfully with ID {Id} by user {UserId}.", role.Name, role.Id, role.CreatedByUserId);

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
                return BadRequest(new { message = "Le nom du rôle est requis." });
            }

            var role = await _context.Roles.FindAsync(id);
            if (role == null)
            {
                _logger.LogWarning("Role with ID {Id} not found.", id);
                return NotFound(new { message = "Rôle non trouvé." });
            }

            // Check if the role name matches any default role names (IDs 1, 2, 3, 4)
            var defaultRoles = await _context.Roles
                .Where(r => new[] { 1, 2, 3, 4 }.Contains(r.Id))
                .Select(r => r.Name)
                .ToListAsync();

            if (defaultRoles.Any(dr => dr.Equals(request.Name, StringComparison.OrdinalIgnoreCase)))
            {
                _logger.LogWarning("Attempted to update role to name {Name} that matches a default role.", request.Name);
                return BadRequest(new { message = "Un rôle avec ce nom existe déjà." });
            }

            // Check for duplicate names among roles created by the same user
            if (await _context.Roles.AnyAsync(r => r.Name == request.Name && r.Id != id && r.CreatedByUserId == role.CreatedByUserId))
            {
                _logger.LogWarning("Role with name {Name} already exists for user {UserId}.", request.Name, role.CreatedByUserId);
                return BadRequest(new { message = "Un rôle avec ce nom existe déjà." });
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
                return NotFound(new { message = "Rôle non trouvé." });
            }

            // Prevent deletion of SuperAdmin role
            if (role.Id == 1)
            {
                _logger.LogWarning("Attempted to delete SuperAdmin role.");
                return BadRequest(new { message = "Le rôle SuperAdmin ne peut pas être supprimé." });
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
                        return BadRequest(new { message = "Rôle par défaut 'User' non trouvé. Impossible de supprimer le rôle." });
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