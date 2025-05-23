﻿using System.Text.RegularExpressions;

namespace TaskService.DTOs
{
    public class UpdateTaskRequest
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? Priority { get; set; }
        public string? Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<string?>? AssignedUserEmails { get; set; }
        public int? ProjectId { get; set; }
        public List<int>? BacklogIds { get; set; }
        public List<string>? Subtasks { get; set; }
        public int? SprintId { get; set; }
        public int? DisplayOrder { get; set; }

        public void Validate()
        {
            if (Title != null && string.IsNullOrWhiteSpace(Title))
                throw new ArgumentException("Le titre ne peut pas être vide.");
            if (ProjectId.HasValue && ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
            if (AssignedUserEmails != null && AssignedUserEmails.Any(email => string.IsNullOrEmpty(email) || !IsValidEmail(email)))
                throw new ArgumentException("Tous les emails fournis doivent être valides.");
            if (Subtasks != null && Subtasks.Any(s => string.IsNullOrWhiteSpace(s)))
                throw new ArgumentException("Les sous-tâches ne peuvent pas être vides.");
            if (DisplayOrder.HasValue && DisplayOrder < 0)
                throw new ArgumentException("L'ordre d'affichage ne peut pas être négatif.");
        }

        private bool IsValidEmail(string email)
        {
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