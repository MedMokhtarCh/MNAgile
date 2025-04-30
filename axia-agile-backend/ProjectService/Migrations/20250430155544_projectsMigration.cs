using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectService.Migrations
{
    /// <inheritdoc />
    public partial class projectsMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ScrumMaster",
                table: "Projects",
                newName: "ScrumMasters");

            migrationBuilder.RenameColumn(
                name: "ProjectManager",
                table: "Projects",
                newName: "ProjectManagers");

            migrationBuilder.RenameColumn(
                name: "ProductOwner",
                table: "Projects",
                newName: "ProductOwners");

            migrationBuilder.AddColumn<string>(
                name: "Observers",
                table: "Projects",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Observers",
                table: "Projects");

            migrationBuilder.RenameColumn(
                name: "ScrumMasters",
                table: "Projects",
                newName: "ScrumMaster");

            migrationBuilder.RenameColumn(
                name: "ProjectManagers",
                table: "Projects",
                newName: "ProjectManager");

            migrationBuilder.RenameColumn(
                name: "ProductOwners",
                table: "Projects",
                newName: "ProductOwner");
        }
    }
}
