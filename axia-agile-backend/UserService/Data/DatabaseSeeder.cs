using Microsoft.EntityFrameworkCore;
using UserService.Models;

namespace UserService.Data
{
    public static class DatabaseSeeder
    {
        public static void SeedDatabase(AppDbContext context)
        {
            try
            {
                Console.WriteLine("Starting database seeding...");

                // Seed SuperAdmin
                SeedSuperAdmin(context);

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

        private static void SeedSuperAdmin(AppDbContext context)
        {
            try
            {
                Console.WriteLine("Vérification du SuperAdmin...");

                // Ensure SuperAdmin role exists
                var superAdminRole = context.Roles.FirstOrDefault(r => r.Id == 1);
                if (superAdminRole == null)
                {
                    throw new InvalidOperationException("Le rôle SuperAdmin (Id = 1) n'existe pas. Assurez-vous que les rôles sont correctement initialisés via migrations.");
                }

                // Check if SuperAdmin user exists
                var superAdminUser = context.Users.FirstOrDefault(u => u.RoleId == 1 && u.Email == "superadmin@gmail.com");
                if (superAdminUser == null)
                {
                    Console.WriteLine("Création du SuperAdmin...");

                    var superAdmin = new User
                    {
                        Email = "superadmin@gmail.com",
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword("123"),
                        FirstName = "Super",
                        LastName = "Admin",
                        PhoneNumber = "1234567890",
                        RoleId = 1,
                        IsActive = true,
                        DateCreated = DateTime.UtcNow
                    };

                    context.Users.Add(superAdmin);
                    context.SaveChanges();

                    Console.WriteLine($"SuperAdmin créé avec succès. ID: {superAdmin.Id}");

                    // Assign all claims to SuperAdmin
                    var claims = context.Claims.ToList();
                    if (!claims.Any())
                    {
                        Console.WriteLine("Aucun claim trouvé. Les claims doivent être initialisés via migrations.");
                    }
                    else
                    {
                        foreach (var claim in claims)
                        {
                            context.UserClaims.Add(new UserClaim { UserId = superAdmin.Id, ClaimId = claim.Id });
                        }
                        context.SaveChanges();
                        Console.WriteLine("Tous les claims attribués au SuperAdmin avec succès.");
                    }
                }
                else
                {
                    Console.WriteLine($"Le SuperAdmin existe déjà avec ID: {superAdminUser.Id}");
                    // Optionally update password (uncomment if needed)
                    // superAdminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("123");
                    // context.SaveChanges();
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