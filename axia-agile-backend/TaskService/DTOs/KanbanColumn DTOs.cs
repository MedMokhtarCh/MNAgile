namespace TaskService.DTOs
{
    public class KanbanColumnDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int ProjectId { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateKanbanColumnRequest
    {
        public string Name { get; set; }
        public int ProjectId { get; set; }
        public int DisplayOrder { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom de la colonne est requis.");
            if (ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
        }
    }

    public class UpdateKanbanColumnRequest
    {
        public string Name { get; set; }
        public int? DisplayOrder { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom de la colonne est requis.");
        }
    }
}