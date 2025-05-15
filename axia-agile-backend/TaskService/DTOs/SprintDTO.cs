using System;
using System.Collections.Generic;

namespace TaskService.DTOs
{
    public class SprintDTO
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public int ProjectId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<int> TaskIds { get; set; } = new List<int>();
    }

    public class CreateSprintRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int ProjectId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool IsActive { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom du sprint est requis.");
            if (ProjectId <= 0)
                throw new ArgumentException("Un ID de projet valide est requis.");
            if (StartDate == default)
                throw new ArgumentException("La date de début est requise.");
            if (EndDate == default)
                throw new ArgumentException("La date de fin est requise.");
            if (EndDate < StartDate)
                throw new ArgumentException("La date de fin doit être postérieure à la date de début.");
        }
    }

    public class UpdateSprintRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? IsActive { get; set; }

        public void Validate()
        {
            if (string.IsNullOrWhiteSpace(Name))
                throw new ArgumentException("Le nom du sprint est requis.");
            if (StartDate.HasValue && EndDate.HasValue && EndDate < StartDate)
                throw new ArgumentException("La date de fin doit être postérieure à la date de début.");
        }
    }
}