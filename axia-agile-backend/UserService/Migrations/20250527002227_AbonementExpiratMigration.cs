using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace UserService.Migrations
{
    /// <inheritdoc />
    public partial class AbonementExpiratMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RootAdminId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.InsertData(
                table: "Claims",
                columns: new[] { "Id", "Description", "Name" },
                values: new object[,]
                {
                    { 13, "Permission de communiquer dans les canaux", "CanCommunicate" },
                    { 14, "Permission de créer et gérer des canaux", "CanCreateChannel" },
                    { 15, "Permission de voir les backlogs", "CanViewBacklogs" },
                    { 16, "Permission de créer des backlogs", "CanCreateBacklogs" },
                    { 17, "Permission de mettre à jour les backlogs", "CanUpdateBacklogs" },
                    { 18, "Permission de supprimer des backlogs", "CanDeleteBacklogs" },
                    { 19, "Permission de voir les colonnes Kanban", "CanViewKanbanColumns" },
                    { 20, "Permission de créer des colonnes Kanban", "CanCreateKanbanColumns" },
                    { 21, "Permission de mettre à jour les colonnes Kanban", "CanUpdateKanbanColumns" },
                    { 22, "Permission de supprimer des colonnes Kanban", "CanDeleteKanbanColumns" },
                    { 23, "Permission de voir les sprints", "CanViewSprints" },
                    { 24, "Permission de créer des sprints", "CanCreateSprints" },
                    { 25, "Permission de mettre à jour les sprints", "CanUpdateSprints" },
                    { 26, "Permission de supprimer des sprints", "CanDeleteSprints" },
                    { 27, "Permission de déplacer les tâches", "CanMoveTasks" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_RootAdminId",
                table: "Users",
                column: "RootAdminId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Users_RootAdminId",
                table: "Users",
                column: "RootAdminId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Users_RootAdminId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_RootAdminId",
                table: "Users");

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Claims",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DropColumn(
                name: "RootAdminId",
                table: "Users");
        }
    }
}
