using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;

namespace TaskService.DTOs
{
    public class UpdateTaskRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<string> AssignedUserEmails { get; set; }
        public int? ProjectId { get; set; }

        public void Validate()
        {
            if (ProjectId.HasValue && ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
            if (AssignedUserEmails != null && AssignedUserEmails.Any(email => string.IsNullOrEmpty(email) || !IsValidEmail(email)))
                throw new ArgumentException("Tous les emails fournis doivent être valides.");
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