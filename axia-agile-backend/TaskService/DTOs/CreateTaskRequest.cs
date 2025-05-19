using System.Text.RegularExpressions;

namespace TaskService.DTOs
{
    public class CreateTaskRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public string Priority { get; set; }
        public string Status { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public List<string?> AssignedUserEmails { get; set; } = new List<string>(); // Already optional by default
        public int ProjectId { get; set; }
        public List<int>? BacklogIds { get; set; } = new List<int>();
        public List<string>? Subtasks { get; set; } = new List<string>();
        public int? SprintId { get; set; }
        public int? DisplayOrder { get; set; } = 0;

        public void Validate()
        {
            if (string.IsNullOrEmpty(Title))
                throw new ArgumentException("Le titre est requis.");
            if (ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
            // Filter out null or empty emails before validation
            var validEmails = AssignedUserEmails?.Where(email => !string.IsNullOrEmpty(email)).ToList() ?? new List<string>();
            if (validEmails.Any(email => !IsValidEmail(email)))
                throw new ArgumentException("Tous les emails fournis doivent être valides.");
            if (Subtasks != null && Subtasks.Any(s => string.IsNullOrWhiteSpace(s)))
                throw new ArgumentException("Les sous-tâches ne peuvent pas être vides.");
            if (DisplayOrder < 0)
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