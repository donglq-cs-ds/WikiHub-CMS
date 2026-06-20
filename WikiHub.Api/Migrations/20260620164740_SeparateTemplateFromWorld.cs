using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeparateTemplateFromWorld : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "WorldId",
                table: "ArticleTemplates",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "Name",
                table: "ArticleTemplates",
                newName: "Title");

            migrationBuilder.RenameColumn(
                name: "HtmlContent",
                table: "ArticleTemplates",
                newName: "Content");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ArticleTemplates",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "ArticleTemplates");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "ArticleTemplates",
                newName: "WorldId");

            migrationBuilder.RenameColumn(
                name: "Title",
                table: "ArticleTemplates",
                newName: "Name");

            migrationBuilder.RenameColumn(
                name: "Content",
                table: "ArticleTemplates",
                newName: "HtmlContent");
        }
    }
}
