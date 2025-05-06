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
    public class ClaimsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ILogger<ClaimsController> _logger;

        public ClaimsController(AppDbContext context, ILogger<ClaimsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClaimDTO>>> GetClaims()
        {
            try
            {
                var claims = await _context.Claims
                    .Select(c => new ClaimDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description
                    })
                    .ToListAsync();
                _logger.LogInformation("Successfully fetched {Count} claims.", claims.Count);
                return Ok(claims);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch claims.");
                return StatusCode(500, new { message = "Échec de la récupération des claims.", error = ex.Message });
            }
        }

        [HttpGet("user/{userId}")]
        [Authorize] // Allow all authenticated users
        public async Task<ActionResult<IEnumerable<ClaimDTO>>> GetUserClaims(int userId)
        {
            try
            {
                var user = await _context.Users
                    .Include(u => u.UserClaims)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null)
                {
                    _logger.LogWarning("User with ID {UserId} not found.", userId);
                    return NotFound("Utilisateur non trouvé.");
                }

                var claimIds = user.UserClaims.Select(uc => uc.ClaimId).ToList();
                var claims = await _context.Claims
                    .Where(c => claimIds.Contains(c.Id))
                    .Select(c => new ClaimDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description
                    })
                    .ToListAsync();

                _logger.LogInformation("Successfully fetched {Count} claims for user ID {UserId}.", claims.Count, userId);
                return Ok(claims);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch claims for user ID {UserId}.", userId);
                return StatusCode(500, new { message = "Échec de la récupération des claims de l'utilisateur.", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClaimDTO>> GetClaimById(int id)
        {
            try
            {
                var claim = await _context.Claims
                    .Where(c => c.Id == id)
                    .Select(c => new ClaimDTO
                    {
                        Id = c.Id,
                        Name = c.Name,
                        Description = c.Description
                    })
                    .FirstOrDefaultAsync();

                if (claim == null)
                {
                    _logger.LogWarning("Claim with ID {Id} not found.", id);
                    return NotFound("Claim non trouvé.");
                }

                _logger.LogInformation("Successfully fetched claim with ID {Id}.", id);
                return Ok(claim);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to fetch claim with ID {Id}.", id);
                return StatusCode(500, new { message = "Échec de la récupération du claim.", error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ClaimDTO>> CreateClaim([FromBody] CreateClaimRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Invalid claim creation request: Name is empty.");
                return BadRequest("Le nom du claim est requis.");
            }

            if (await _context.Claims.AnyAsync(c => c.Name == request.Name))
            {
                _logger.LogWarning("Claim with name {Name} already exists.", request.Name);
                return BadRequest("Un claim avec ce nom existe déjà.");
            }

            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    int newId = 1;
                    var existingIds = await _context.Claims
                        .Select(c => c.Id)
                        .OrderBy(id => id)
                        .ToListAsync();

                    while (existingIds.Contains(newId))
                    {
                        newId++;
                    }

                    var claim = new Claim
                    {
                        Id = newId,
                        Name = request.Name,
                        Description = request.Description ?? ""
                    };

                    _context.Claims.Add(claim);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation("Claim {Name} created successfully with ID {Id}.", claim.Name, claim.Id);

                    var claimDTO = new ClaimDTO
                    {
                        Id = claim.Id,
                        Name = claim.Name,
                        Description = claim.Description
                    };

                    return CreatedAtAction(nameof(GetClaimById), new { id = claim.Id }, claimDTO);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating claim {Name}. Transaction rolled back.", request.Name);
                    return StatusCode(500, new { message = "Une erreur est survenue lors de la création du claim.", error = ex.Message });
                }
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ClaimDTO>> UpdateClaim(int id, [FromBody] UpdateClaimRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Name))
            {
                _logger.LogWarning("Invalid claim update request: Name is empty.");
                return BadRequest("Le nom du claim est requis.");
            }

            var claim = await _context.Claims.FindAsync(id);
            if (claim == null)
            {
                _logger.LogWarning("Claim with ID {Id} not found.", id);
                return NotFound("Claim non trouvé.");
            }

            if (await _context.Claims.AnyAsync(c => c.Name == request.Name && c.Id != id))
            {
                _logger.LogWarning("Claim with name {Name} already exists.", request.Name);
                return BadRequest("Un claim avec ce nom existe déjà.");
            }

            try
            {
                claim.Name = request.Name;
                claim.Description = request.Description ?? "";

                _context.Claims.Update(claim);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Claim {Name} updated successfully with ID {Id}.", claim.Name, claim.Id);

                var claimDTO = new ClaimDTO
                {
                    Id = claim.Id,
                    Name = claim.Name,
                    Description = claim.Description
                };

                return Ok(claimDTO);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating claim with ID {Id}.", id);
                return StatusCode(500, new { message = "Une erreur est survenue lors de la mise à jour du claim.", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClaim(int id)
        {
            var claim = await _context.Claims.FindAsync(id);
            if (claim == null)
            {
                _logger.LogWarning("Claim with ID {Id} not found.", id);
                return NotFound("Claim non trouvé.");
            }

            try
            {
                _context.Claims.Remove(claim);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Claim {Name} deleted successfully with ID {Id}.", claim.Name, claim.Id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting claim with ID {Id}.", id);
                return StatusCode(500, new { message = "Une erreur est survenue lors de la suppression du claim.", error = ex.Message });
            }
        }
    }
}