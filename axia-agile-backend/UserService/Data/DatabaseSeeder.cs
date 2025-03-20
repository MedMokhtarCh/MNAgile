using UserService.Models;

namespace UserService.Data
{
    public static class DatabaseSeeder
    {
        public static void SeedDatabase(AppDbContext context)
        {
            try
            {
                
                if (!context.Roles.Any())
                {
                    Console.WriteLine("Initialisation des rôles...");
                    context.Roles.AddRange(
                        new Role { Id = 1, Name = "SuperAdmin" },
                        new Role { Id = 2, Name = "Admin" },
                        new Role { Id = 3, Name = "ChefProjet" },
                        new Role { Id = 4, Name = "User" }
                    );
                    context.SaveChanges();
                    Console.WriteLine("Rôles initialisés avec succès.");
                }
                else
                {
                    Console.WriteLine("Les rôles existent déjà dans la base de données.");
                }

                
                if (!context.Claims.Any())
                {
                    Console.WriteLine("Initialisation des claims...");
                    context.Claims.AddRange(
                        new Claim { Id = 1, Name = "CanViewUsers", Description = "Permission de voir les utilisateurs" },
                        new Claim { Id = 2, Name = "CanCreateUsers", Description = "Permission de créer des utilisateurs" },
                        new Claim { Id = 3, Name = "CanUpdateUsers", Description = "Permission de mettre à jour les utilisateurs" },
                        new Claim { Id = 4, Name = "CanDeleteUsers", Description = "Permission de supprimer des utilisateurs" }
                    );
                    context.SaveChanges();
                    Console.WriteLine("Claims initialisés avec succès.");
                }
                else
                {
                    Console.WriteLine("Les claims existent déjà dans la base de données.");
                }

                // Créer le SuperAdmin
                SeedSuperAdmin(context);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erreur lors de l'initialisation de la base de données: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Exception interne: {ex.InnerException.Message}");
                }
            }
        }

        public static void SeedSuperAdmin(AppDbContext context)
        {
            var superAdminUser = context.Users.FirstOrDefault(u => u.RoleId == 1);

            if (superAdminUser == null)
            {
                Console.WriteLine("Création du SuperAdmin...");

                var superAdmin = new User
                {
                    Email = "superadmin@gmail.com",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("superadmin123"),
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

             
                var claims = context.Claims.ToList();
                foreach (var claim in claims)
                {
                    context.UserClaims.Add(new UserClaim { UserId = superAdmin.Id, ClaimId = claim.Id });
                }

                context.SaveChanges();
            }
            else
            {
                Console.WriteLine($"Le SuperAdmin existe déjà avec ID: {superAdminUser.Id}");
                //  reset the password if needed
              //  superAdminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("superadmin123");
                // context.SaveChanges();
            }
        }
    }
    }
