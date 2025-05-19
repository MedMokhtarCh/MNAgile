namespace TaskService.DTOs
{
    public class TaskStatusRequest
    {
        public string Status { get; set; }
        public int DisplayOrder { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Status))
                throw new ArgumentException("Le statut est requis.");
            if (DisplayOrder < 0)
                throw new ArgumentException("L'ordre d'affichage ne peut pas être négatif.");
        }
    }
}