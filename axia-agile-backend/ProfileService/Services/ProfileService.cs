using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ProfileService.Data;
using ProfileService.DTOs;
using ProfileService.Models;

namespace ProfileService.Services
{
    public class ProfileService
    {
        private readonly AppDbContext _context;
        private readonly UserServiceClient _userServiceClient;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<ProfileService> _logger;

        public ProfileService(
            AppDbContext context,
            UserServiceClient userServiceClient,
            IWebHostEnvironment environment,
            ILogger<ProfileService> logger)
        {
            _context = context;
            _userServiceClient = userServiceClient;
            _environment = environment;
            _logger = logger;
        }

        public async Task<ProfileDTO> GetProfileByUserIdAsync(int userId)
        {
            _logger.LogInformation($"Retrieving profile for UserId: {userId}");
            var user = await _userServiceClient.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found.");
                throw new InvalidOperationException("Utilisateur non trouvé.");
            }

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            var photoUrl = profile?.ProfilePhotoPath != null
                ? $"/Uploads/{Path.GetFileName(profile.ProfilePhotoPath)}"
                : null;

            var profileDto = new ProfileDTO
            {
                UserId = user.Id,
                Email = user.Email ?? "",
                FirstName = profile?.FirstName ?? user.FirstName ?? "",
                LastName = profile?.LastName ?? user.LastName ?? "",
                PhoneNumber = profile?.PhoneNumber ?? user.PhoneNumber ?? "",
                JobTitle = profile?.JobTitle ?? user.JobTitle ?? "",
                ProfilePhotoUrl = photoUrl
            };

            _logger.LogDebug($"Profile retrieved: {System.Text.Json.JsonSerializer.Serialize(profileDto)}");
            return profileDto;
        }

        public async Task<ProfileDTO> UpdateProfileAsync(int userId, UpdateProfileRequest request)
        {
            _logger.LogInformation($"Updating profile for UserId: {userId} with data: {System.Text.Json.JsonSerializer.Serialize(request)}");

            var user = await _userServiceClient.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found.");
                throw new InvalidOperationException("Utilisateur non trouvé.");
            }

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            if (profile == null)
            {
                profile = new Profile { UserId = userId };
                _context.Profiles.Add(profile);
            }

            // Update profile fields only if provided
            profile.FirstName = request.FirstName ?? profile.FirstName ?? user.FirstName ?? "";
            profile.LastName = request.LastName ?? profile.LastName ?? user.LastName ?? "";
            profile.PhoneNumber = request.PhoneNumber ?? profile.PhoneNumber ?? user.PhoneNumber ?? "";
            profile.JobTitle = request.JobTitle ?? profile.JobTitle ?? user.JobTitle ?? "";

            try
            {
                await _context.SaveChangesAsync();

                // Only update UserService if fields differ
                if (user.FirstName != profile.FirstName ||
                    user.LastName != profile.LastName ||
                    user.PhoneNumber != profile.PhoneNumber ||
                    user.JobTitle != profile.JobTitle)
                {
                    var updateRequest = new UserServiceClient.UpdateOwnProfileRequest
                    {
                        FirstName = profile.FirstName,
                        LastName = profile.LastName,
                        PhoneNumber = profile.PhoneNumber,
                        JobTitle = profile.JobTitle
                    };
                    await _userServiceClient.UpdateUserProfileAsync(userId, updateRequest);
                    _logger.LogDebug($"User profile updated in UserService: {System.Text.Json.JsonSerializer.Serialize(updateRequest)}");
                }

                var photoUrl = !string.IsNullOrEmpty(profile.ProfilePhotoPath)
                    ? $"/Uploads/{Path.GetFileName(profile.ProfilePhotoPath)}"
                    : null;

                var profileDto = new ProfileDTO
                {
                    UserId = user.Id,
                    Email = user.Email ?? "",
                    FirstName = profile.FirstName,
                    LastName = profile.LastName,
                    PhoneNumber = profile.PhoneNumber,
                    JobTitle = profile.JobTitle,
                    ProfilePhotoUrl = photoUrl
                };

                _logger.LogDebug($"Profile updated: {System.Text.Json.JsonSerializer.Serialize(profileDto)}");
                return profileDto;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError($"Database error: {ex.Message}");
                throw new InvalidOperationException("Erreur lors de la sauvegarde du profil.");
            }
        }

        public async Task UpdatePasswordAsync(int userId, string newPassword)
        {
            _logger.LogInformation($"Updating password for UserId: {userId}");
            if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 8)
            {
                _logger.LogWarning("Password does not meet minimum requirements.");
                throw new InvalidOperationException("Le mot de passe doit contenir au moins 8 caractères.");
            }

            try
            {
                await _userServiceClient.UpdateUserPasswordAsync(userId, newPassword);
                _logger.LogInformation($"Password updated in UserService for UserId: {userId}");
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError($"Failed to update password in UserService for UserId: {userId}: {ex.Message}");
                throw new InvalidOperationException("Erreur lors de la mise à jour du mot de passe dans UserService. Contactez l'administrateur.");
            }
        }

        public async Task<ProfileDTO> UploadProfilePhotoAsync(int userId, IFormFile file)
        {
            try
            {
                _logger.LogInformation($"Attempting to upload profile photo for UserId: {userId}, File: {file.FileName}, Size: {file.Length} bytes, MIME: {file.ContentType}");

                var user = await _userServiceClient.GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in UserService.");
                    throw new InvalidOperationException("Utilisateur non trouvé.");
                }

                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension) || !new[] { "image/jpeg", "image/png" }.Contains(file.ContentType))
                {
                    _logger.LogWarning($"Invalid file type: {extension}, MIME: {file.ContentType}");
                    throw new InvalidOperationException("Seuls les fichiers JPG et PNG sont autorisés.");
                }

                if (file.Length > 5 * 1024 * 1024)
                {
                    _logger.LogWarning($"File size exceeds 5MB: {file.Length} bytes");
                    throw new InvalidOperationException("La taille du fichier ne doit pas dépasser 5 Mo.");
                }

                var uploadsFolder = Path.Combine(_environment.WebRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    _logger.LogInformation("Creating Uploads directory");
                    Directory.CreateDirectory(uploadsFolder);
                }

                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profile == null)
                {
                    profile = new Profile { UserId = userId };
                    _context.Profiles.Add(profile);
                }

                if (!string.IsNullOrEmpty(profile.ProfilePhotoPath) && File.Exists(profile.ProfilePhotoPath))
                {
                    _logger.LogInformation($"Deleting old photo: {profile.ProfilePhotoPath}");
                    File.Delete(profile.ProfilePhotoPath);
                }
                profile.ProfilePhotoPath = fileName; // Store only the file name

                await _context.SaveChangesAsync();

                var photoUrl = $"/Uploads/{fileName}";
                _logger.LogInformation($"Profile photo saved at: {photoUrl}");

                var profileDto = new ProfileDTO
                {
                    UserId = user.Id,
                    Email = user.Email ?? "",
                    FirstName = profile.FirstName ?? user.FirstName ?? "",
                    LastName = profile.LastName ?? user.LastName ?? "",
                    PhoneNumber = profile.PhoneNumber ?? user.PhoneNumber ?? "",
                    JobTitle = profile.JobTitle ?? user.JobTitle ?? "",
                    ProfilePhotoUrl = photoUrl
                };

                _logger.LogDebug($"Profile photo uploaded: {System.Text.Json.JsonSerializer.Serialize(profileDto)}");
                return profileDto;
            }
            catch (DbUpdateException ex)
            {
                _logger.LogError(ex, $"Database error while saving profile changes: {ex.InnerException?.Message}");
                throw new InvalidOperationException($"Erreur lors de la sauvegarde du profil : {ex.InnerException?.Message ?? ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Unhandled exception in UploadProfilePhotoAsync: {ex.Message}");
                throw new InvalidOperationException($"Erreur inattendue lors de l'upload de la photo : {ex.Message}");
            }
        }
    }
}