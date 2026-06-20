using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCascadeDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Articles_WorldId",
                table: "Articles",
                column: "WorldId");

            migrationBuilder.AddForeignKey(
                name: "FK_Articles_Worlds_WorldId",
                table: "Articles",
                column: "WorldId",
                principalTable: "Worlds",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Articles_Worlds_WorldId",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_Articles_WorldId",
                table: "Articles");
        }
    }
}
