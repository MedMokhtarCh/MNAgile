﻿namespace UserService.DTOs
{
    public class CreateRoleRequest
    {
        public string Name { get; set; }
        public int CreatedByUserId { get; set; } 
    }
}