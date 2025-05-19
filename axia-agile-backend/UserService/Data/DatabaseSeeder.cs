using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using UserService.Models;

namespace UserService.Data
{
    public static class DatabaseSeeder
    {
        public static void SeedDatabase(AppDbContext context, IWebHostEnvironment environment)
        {
            try
            {
                Console.WriteLine("Starting database seeding...");
                SeedSuperAdmin(context, environment);
                Console.WriteLine("Database seeding completed successfully.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de l'initialisation de la base de données: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Exception interne: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        private static void SeedSuperAdmin(AppDbContext context, IWebHostEnvironment environment)
        {
            try
            {
                Console.WriteLine("Vérification du SuperAdmin...");
                var superAdminRole = context.Roles.FirstOrDefault(r => r.Id == 1);
                if (superAdminRole == null)
                {
                    throw new InvalidOperationException("Le rôle SuperAdmin (Id = 1) n'existe pas.");
                }

                var superAdminUser = context.Users.FirstOrDefault(u => u.RoleId == 1 && u.Email == "superadmin@gmail.com");
                if (superAdminUser == null)
                {
                    Console.WriteLine("Création du SuperAdmin...");
                    var password = Environment.GetEnvironmentVariable("SUPERADMIN_PASSWORD");

                    // Fallback for development only
                    if (environment.IsDevelopment() && string.IsNullOrEmpty(password))
                    {
                        password = "DefaultSuperAdmin123!";
                        Console.WriteLine("SUPERADMIN_PASSWORD non défini. Utilisation du mot de passe par défaut pour le développement: DefaultSuperAdmin123!");
                    }

                    if (string.IsNullOrEmpty(password))
                    {
                        throw new InvalidOperationException("Le mot de passe du SuperAdmin doit être défini dans SUPERADMIN_PASSWORD.");
                    }

                    if (password.Length < 12 ||
                        !Regex.IsMatch(password, @"[A-Z]") ||
                        !Regex.IsMatch(password, @"[a-z]") ||
                        !Regex.IsMatch(password, @"[0-9]") ||
                        !Regex.IsMatch(password, @"[!@#$%^&*]"))
                    {
                        throw new InvalidOperationException("Le mot de passe du SuperAdmin doit contenir au moins 12 caractères, incluant majuscule, minuscule, chiffre et caractère spécial.");
                    }

                    var superAdmin = new User
                    {
                        Email = "superadmin@gmail.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                        FirstName = "Super",
                        LastName = "Admin",
                        PhoneNumber = "1234567890",
                        RoleId = 1,
                        IsActive = true,
                        DateCreated = DateTime.UtcNow
                    };

                    context.Users.Add(superAdmin);
                    context.SaveChanges();

                    var claims = context.Claims.ToList();
                    foreach (var claim in claims)
                    {
                        context.UserClaims.Add(new UserClaim { UserId = superAdmin.Id, ClaimId = claim.Id });
                    }
                    context.SaveChanges();
                    Console.WriteLine("SuperAdmin créé avec tous les claims.");
                }
                else
                {
                    Console.WriteLine($"Le SuperAdmin existe déjà avec ID: {superAdminUser.Id}");
                }
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"Erreur lors de la création du SuperAdmin: {ex.InnerException?.Message ?? ex.Message}");
                throw;
            }
        }
    }
}