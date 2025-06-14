﻿using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using UserService.Data;
using UserService.Models;
using Claim = System.Security.Claims.Claim;

namespace UserService.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<User> AuthenticateAsync(string email, string password)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.UserClaims)
                .ThenInclude(uc => uc.Claim)
                .Include(u => u.Subscription)
                .Include(u => u.RootAdmin)
                .ThenInclude(ra => ra.Subscription)
                .FirstOrDefaultAsync(u => u.Email == email);

            if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            {
                return null; // Email ou mot de passe incorrect
            }

            // Vérifier si l'utilisateur est inactif
            if (!user.IsActive)
            {
                if (user.Subscription?.Status == "Pending")
                {
                    throw new UnauthorizedAccessException("Votre compte est en attente de validation. Vous recevrez un email une fois votre abonnement validé.");
                }
                throw new UnauthorizedAccessException("Votre compte est désactivé. Veuillez contacter l'administrateur pour plus d'informations.");
            }

            // Vérifier l'abonnement de l'utilisateur
            if (user.Subscription != null)
            {
                if (user.Subscription.Status == "Pending")
                {
                    throw new UnauthorizedAccessException("Votre compte est en attente de validation. Vous recevrez un email une fois votre abonnement validé.");
                }
                if (user.Subscription.Status != "Active" || user.Subscription.EndDate <= DateTime.UtcNow)
                {
                    throw new UnauthorizedAccessException("Votre compte a expiré. Veuillez renouveler votre abonnement pour vous connecter.");
                }
            }

            // Vérifier l'abonnement du root admin si applicable
            if (user.RootAdminId.HasValue)
            {
                var rootAdmin = await _context.Users
                    .Include(u => u.Subscription)
                    .FirstOrDefaultAsync(u => u.Id == user.RootAdminId);
                if (rootAdmin != null && rootAdmin.Subscription != null)
                {
                    if (rootAdmin.Subscription.Status == "Pending")
                    {
                        throw new UnauthorizedAccessException("Votre compte est en attente de validation. Vous recevrez un email une fois votre abonnement validé.");
                    }
                    if (rootAdmin.Subscription.Status != "Active" || rootAdmin.Subscription.EndDate <= DateTime.UtcNow)
                    {
                        user.IsActive = false;
                        await _context.SaveChangesAsync();
                        throw new UnauthorizedAccessException("Votre compte a expiré. Veuillez renouveler votre abonnement pour vous connecter.");
                    }
                }
            }

            user.LastLogin = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return user;
        }

        public string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = Encoding.ASCII.GetBytes(jwtSettings["Key"]);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim("RoleId", user.RoleId.ToString()),
                new Claim("Role", user.Role.Name)
            };

            foreach (var userClaim in user.UserClaims)
            {
                claims.Add(new Claim(userClaim.Claim.Name, "true"));
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(24),
                NotBefore = DateTime.UtcNow,
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }

        public bool IsValidEmail(string email)
        {
            if (string.IsNullOrEmpty(email))
                return false;

            try
            {
                var regex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");
                return regex.IsMatch(email);
            }
            catch
            {
                return false;
            }
        }
    }
}