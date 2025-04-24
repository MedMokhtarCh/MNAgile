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

        public ClaimsController(AppDbContext context)
        {
            _context = context;
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
                return Ok(claims);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Failed to fetch claims", error = ex.Message });
            }
        }
    }
   }
