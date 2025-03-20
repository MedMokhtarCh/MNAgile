using UserService.Data;
using UserService.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace UserService.Services
{
    public class UserService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<UserService> _logger;

        public UserService(AppDbContext context, ILogger<UserService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> RoleExistsAsync(int roleId)
        {
            return await _context.Roles.AnyAsync(r => r.Id == roleId);
        }

        public async Task<User> CreateUserAsync(User user, List<int> claimIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                user.DateCreated = DateTime.UtcNow;
                user.IsActive = true;
                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                foreach (var claimId in claimIds)
                {
                    _context.UserClaims.Add(new UserClaim { UserId = user.Id, ClaimId = claimId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"User {user.Email} created successfully.");
                return user;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error creating user {user.Email}: {ex.Message}");
                throw;
            }
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .ToListAsync();
        }

        public async Task<User> UpdateUserAsync(User user, List<int> claimIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Mettez à jour l'utilisateur
                _context.Users.Update(user);

                // Supprimez les anciens claims
                var existingClaims = await _context.UserClaims.Where(uc => uc.UserId == user.Id).ToListAsync();
                _context.UserClaims.RemoveRange(existingClaims);

                // Ajoutez les nouveaux claims
                foreach (var claimId in claimIds)
                {
                    _context.UserClaims.Add(new UserClaim { UserId = user.Id, ClaimId = claimId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation($"User {user.Email} updated successfully.");
                return user;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error updating user {user.Email}: {ex.Message}");
                throw;
            }
        }
        public async Task DeleteUserAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user != null)
                {
                    _context.Users.Remove(user);
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    _logger.LogInformation($"User {user.Email} deleted successfully.");
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError($"Error deleting user with ID {id}: {ex.Message}");
                throw;
            }

        }
        public async Task<bool> UserExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }
    }
}