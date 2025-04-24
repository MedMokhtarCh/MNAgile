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

            return new ProfileDTO
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                JobTitle = user.JobTitle,
                ProfilePhotoUrl = photoUrl
            };
        }

        public async Task<ProfileDTO> UpdateProfileAsync(int userId, UpdateProfileRequest request)
        {
            _logger.LogInformation($"Updating profile for UserId: {userId}");
            var user = await _userServiceClient.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found.");
                throw new InvalidOperationException("Utilisateur non trouvé.");
            }

            user.FirstName = request.FirstName ?? user.FirstName;
            user.LastName = request.LastName ?? user.LastName;
            user.PhoneNumber = request.PhoneNumber ?? user.PhoneNumber;
            user.JobTitle = request.JobTitle ?? user.JobTitle;

            await _userServiceClient.UpdateUserAsync(user);

            var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
            var photoUrl = profile?.ProfilePhotoPath != null
                ? $"/Uploads/{Path.GetFileName(profile.ProfilePhotoPath)}"
                : null;

            return new ProfileDTO
            {
                UserId = user.Id,
                Email = user.Email,
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                JobTitle = user.JobTitle,
                ProfilePhotoUrl = photoUrl
            };
        }

        public async Task UpdatePasswordAsync(int userId, string newPassword)
        {
            _logger.LogInformation($"Updating password for UserId: {userId}");
            if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 6)
            {
                _logger.LogWarning("Password must be at least 6 characters.");
                throw new InvalidOperationException("Le mot de passe doit contenir au moins 6 caractères.");
            }

            var user = await _userServiceClient.GetUserByIdAsync(userId);
            if (user == null)
            {
                _logger.LogError($"User with ID {userId} not found.");
                throw new InvalidOperationException("Utilisateur non trouvé.");
            }

            await _userServiceClient.UpdateUserPasswordAsync(userId, newPassword);
        }

        public async Task<ProfileDTO> UploadProfilePhotoAsync(int userId, IFormFile file)
        {
            try
            {
                _logger.LogInformation($"Attempting to upload profile photo for UserId: {userId}");

                var user = await _userServiceClient.GetUserByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogError($"User with ID {userId} not found in UserService.");
                    throw new InvalidOperationException("Utilisateur non trouvé.");
                }
                _logger.LogInformation($"User found: {user.Email}");

                // Validate file
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png" };
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(extension))
                {
                    _logger.LogWarning($"Invalid file extension: {extension}");
                    throw new InvalidOperationException("Seuls les fichiers JPG, JPEG et PNG sont autorisés.");
                }

                if (file.Length > 5 * 1024 * 1024) // 5MB limit
                {
                    _logger.LogWarning($"File size exceeds 5MB: {file.Length} bytes");
                    throw new InvalidOperationException("La taille du fichier ne doit pas dépasser 5 Mo.");
                }

                // Check if uploads folder exists and create it if not
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "Uploads");
                _logger.LogInformation($"Uploads folder path: {uploadsFolder}");

                if (!Directory.Exists(uploadsFolder))
                {
                    _logger.LogInformation("Creating Uploads directory");
                    try
                    {
                        Directory.CreateDirectory(uploadsFolder);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Error creating Uploads directory: {ex.Message}");
                        throw new InvalidOperationException($"Erreur lors de la création du répertoire d'Uploads: {ex.Message}");
                    }
                }

                // Save file
                var fileName = $"{Guid.NewGuid()}{extension}";
                var filePath = Path.Combine(uploadsFolder, fileName);
                _logger.LogInformation($"Saving file to: {filePath}");

                try
                {
                    using (var stream = new FileStream(filePath, FileMode.Create))
                    {
                        await file.CopyToAsync(stream);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError($"Error saving file: {ex.Message}");
                    throw new InvalidOperationException($"Erreur lors de l'enregistrement du fichier: {ex.Message}");
                }

                // Update or create profile
                var profile = await _context.Profiles.FirstOrDefaultAsync(p => p.UserId == userId);
                if (profile == null)
                {
                    _logger.LogInformation($"Creating new profile for UserId: {userId}");
                    profile = new Profile { UserId = userId, ProfilePhotoPath = filePath };
                    _context.Profiles.Add(profile);
                }
                else
                {
                    _logger.LogInformation($"Updating existing profile for UserId: {userId}");
                    if (!string.IsNullOrEmpty(profile.ProfilePhotoPath) && File.Exists(profile.ProfilePhotoPath))
                    {
                        try
                        {
                            File.Delete(profile.ProfilePhotoPath);
                            _logger.LogInformation($"Deleted old profile photo: {profile.ProfilePhotoPath}");
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning($"Could not delete old profile photo: {ex.Message}");
                        }
                    }
                    profile.ProfilePhotoPath = filePath;
                    _context.Entry(profile).State = EntityState.Modified;
                }

                _logger.LogInformation("Saving changes to database");
                try
                {
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Changes saved successfully");
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError($"Database error when saving profile: {dbEx.Message}");
                    _logger.LogError($"Inner exception: {dbEx.InnerException?.Message}");
                    throw new InvalidOperationException($"Erreur lors de l'enregistrement du profil: {dbEx.InnerException?.Message ?? dbEx.Message}");
                }

                return new ProfileDTO
                {
                    UserId = user.Id,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    PhoneNumber = user.PhoneNumber,
                    JobTitle = user.JobTitle,
                    ProfilePhotoUrl = $"/Uploads/{fileName}"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError($"Unhandled exception in UploadProfilePhotoAsync: {ex.Message}");
                throw;
            }
        }
    }
}