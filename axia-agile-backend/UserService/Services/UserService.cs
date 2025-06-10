using Microsoft.EntityFrameworkCore;
using UserService.Data;
using UserService.Models;

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
                if (await _context.Users.AnyAsync(u => u.Email == user.Email))
                {
                    _logger.LogWarning("Email already exists: {Email}", user.Email);
                    throw new InvalidOperationException("Un compte avec cet email existe déjà.");
                }

                user.DateCreated = DateTime.UtcNow;
                user.IsActive = user.IsActive;

                if (user.CreatedById.HasValue)
                {
                    var creator = await _context.Users
                        .Include(u => u.Subscription)
                        .FirstOrDefaultAsync(u => u.Id == user.CreatedById);
                    if (creator != null)
                    {
                        user.RootAdminId = creator.RootAdminId ?? creator.Id;
                    }
                }

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                if (user.RoleId == 2 && !user.CreatedById.HasValue)
                {
                    user.RootAdminId = user.Id;
                    _context.Users.Update(user);
                    await _context.SaveChangesAsync();
                }

                if (user.RoleId == 1)
                {
                    claimIds = await _context.Claims.Select(c => c.Id).ToListAsync();
                }
                else if (user.RoleId == 2)
                {
                    var defaultAdminClaims = await _context.Claims
                        .Where(c => c.Name == "CanViewUsers" || c.Name == "CanCreateUsers")
                        .Select(c => c.Id)
                        .ToListAsync();
                    claimIds.AddRange(defaultAdminClaims);
                }
                else if (user.RoleId == 3)
                {
                    var defaultChefProjetClaims = await _context.Claims
                        .Where(c => c.Name == "CanViewUsers")
                        .Select(c => c.Id)
                        .ToListAsync();
                    claimIds.AddRange(defaultChefProjetClaims);
                }

                claimIds = claimIds.Distinct().ToList();

                foreach (var claimId in claimIds)
                {
                    if (!await _context.Claims.AnyAsync(c => c.Id == claimId))
                    {
                        _logger.LogWarning("Claim ID {ClaimId} does not exist for user {Email}.", claimId, user.Email);
                        throw new InvalidOperationException($"Claim ID {claimId} n'existe pas.");
                    }
                    _context.UserClaims.Add(new UserClaim { UserId = user.Id, ClaimId = claimId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("User {Email} created successfully with RootAdminId {RootAdminId}.", user.Email, user.RootAdminId);
                return user;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating user {Email}. InnerException: {InnerException}", user.Email, ex.InnerException?.Message);
                throw;
            }
        }

        public async Task<List<User>> GetAllUsersAsync(int createdById)
        {
            _logger.LogInformation("Fetching users created by ID {CreatedById}", createdById);
            return await _context.Users
                .Where(u => u.CreatedById == createdById)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .Include(u => u.Subscription)
                .ToListAsync();
        }

        public async Task<User> GetUserByIdAsync(int id)
        {
            _logger.LogInformation("Fetching user by ID {Id}", id);
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .Include(u => u.Subscription)
                .Include(u => u.RootAdmin)
                .ThenInclude(ra => ra.Subscription)
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            _logger.LogInformation("Fetching all users");
            return await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .Include(u => u.Subscription)
                .Include(u => u.RootAdmin)
                .ThenInclude(ra => ra.Subscription)
                .ToListAsync();
        }

        public async Task<User> UpdateUserAsync(User user, List<int> claimIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == user.Email && u.Id != user.Id))
                {
                    _logger.LogWarning("Email {Email} already exists for another user.", user.Email);
                    throw new InvalidOperationException("Un compte avec cet email existe déjà.");
                }

                if (user.CreatedById.HasValue)
                {
                    var creator = await _context.Users
                        .Include(u => u.Subscription)
                        .FirstOrDefaultAsync(u => u.Id == user.CreatedById);
                    if (creator != null)
                    {
                        user.RootAdminId = creator.RootAdminId ?? creator.Id;
                    }
                }

                foreach (var claimId in claimIds)
                {
                    if (!await _context.Claims.AnyAsync(c => c.Id == claimId))
                    {
                        _logger.LogWarning("Claim ID {ClaimId} does not exist for user {Email}.", claimId, user.Email);
                        throw new InvalidOperationException($"Claim ID {claimId} does not exist.");
                    }
                }

                _context.Users.Update(user);

                var existingClaims = await _context.UserClaims.Where(uc => uc.UserId == user.Id).ToListAsync();
                _context.UserClaims.RemoveRange(existingClaims);

                foreach (var claimId in claimIds)
                {
                    _context.UserClaims.Add(new UserClaim { UserId = user.Id, ClaimId = claimId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("User {Email} updated successfully with claimIds: {ClaimIds}", user.Email, string.Join(", ", claimIds));
                return user;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating user {Email}. InnerException: {InnerException}", user.Email, ex.InnerException?.Message);
                throw;
            }
        }

        public async Task<User> PatchUserClaimsAsync(User user, List<int> claimIds)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                foreach (var claimId in claimIds)
                {
                    if (!await _context.Claims.AnyAsync(c => c.Id == claimId))
                    {
                        _logger.LogWarning("Claim ID {ClaimId} does not exist for user {Email}.", claimId, user.Email);
                        throw new InvalidOperationException($"Claim ID {claimId} n'existe pas.");
                    }
                }

                var existingClaims = await _context.UserClaims.Where(uc => uc.UserId == user.Id).ToListAsync();
                _context.UserClaims.RemoveRange(existingClaims);

                foreach (var claimId in claimIds)
                {
                    _context.UserClaims.Add(new UserClaim { UserId = user.Id, ClaimId = claimId });
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("User {Email} claims patched successfully with claimIds: {ClaimIds}", user.Email, string.Join(", ", claimIds));
                return user;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error patching user {Email} claims. InnerException: {InnerException}", user.Email, ex.InnerException?.Message);
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
                    _logger.LogInformation("User {Email} deleted successfully.", user.Email);
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error deleting user with ID {Id}. InnerException: {InnerException}", id, ex.InnerException?.Message);
                throw;
            }
        }

        public async Task<bool> UserExistsAsync(string email)
        {
            return await _context.Users.AnyAsync(u => u.Email == email);
        }

        public async Task DeactivateUsersByRootAdminAsync(int rootAdminId)
        {
            var users = await _context.Users
                .Where(u => u.RootAdminId == rootAdminId && u.Id != rootAdminId)
                .ToListAsync();
            foreach (var user in users)
            {
                user.IsActive = false;
                _context.Users.Update(user);
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deactivated {Count} users under root admin ID {RootAdminId}.", users.Count, rootAdminId);
        }
    }
}