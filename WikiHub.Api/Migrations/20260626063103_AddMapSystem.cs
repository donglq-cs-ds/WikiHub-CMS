using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WikiHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMapSystem : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "WorldMaps",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    WorldId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Title = table.Column<string>(type: "TEXT", nullable: false),
                    BackgroundImagePath = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WorldMaps", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WorldMaps_Worlds_WorldId",
                        column: x => x.WorldId,
                        principalTable: "Worlds",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MapLayers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MapId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", nullable: false),
                    Order = table.Column<int>(type: "INTEGER", nullable: false),
                    IsVisibleByDefault = table.Column<bool>(type: "INTEGER", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapLayers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapLayers_WorldMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "WorldMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MapPins",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    MapId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LayerIds = table.Column<string>(type: "TEXT", nullable: false),
                    ArticleId = table.Column<Guid>(type: "TEXT", nullable: true),
                    X = table.Column<float>(type: "REAL", nullable: false),
                    Y = table.Column<float>(type: "REAL", nullable: false),
                    Label = table.Column<string>(type: "TEXT", nullable: false),
                    PinType = table.Column<string>(type: "TEXT", nullable: false),
                    Color = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    MapLayerId = table.Column<Guid>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapPins", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapPins_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_MapPins_MapLayers_MapLayerId",
                        column: x => x.MapLayerId,
                        principalTable: "MapLayers",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_MapPins_WorldMaps_MapId",
                        column: x => x.MapId,
                        principalTable: "WorldMaps",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MapShapes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    LayerId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Type = table.Column<string>(type: "TEXT", nullable: false),
                    Data = table.Column<string>(type: "TEXT", nullable: false),
                    Color = table.Column<string>(type: "TEXT", nullable: false),
                    StrokeWidth = table.Column<float>(type: "REAL", nullable: false),
                    Opacity = table.Column<float>(type: "REAL", nullable: false),
                    IsFilled = table.Column<bool>(type: "INTEGER", nullable: false),
                    FillColor = table.Column<string>(type: "TEXT", nullable: true),
                    Label = table.Column<string>(type: "TEXT", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MapShapes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MapShapes_MapLayers_LayerId",
                        column: x => x.LayerId,
                        principalTable: "MapLayers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MapLayers_MapId",
                table: "MapLayers",
                column: "MapId");

            migrationBuilder.CreateIndex(
                name: "IX_MapPins_ArticleId",
                table: "MapPins",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_MapPins_MapId",
                table: "MapPins",
                column: "MapId");

            migrationBuilder.CreateIndex(
                name: "IX_MapPins_MapLayerId",
                table: "MapPins",
                column: "MapLayerId");

            migrationBuilder.CreateIndex(
                name: "IX_MapShapes_LayerId",
                table: "MapShapes",
                column: "LayerId");

            migrationBuilder.CreateIndex(
                name: "IX_WorldMaps_WorldId",
                table: "WorldMaps",
                column: "WorldId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MapPins");

            migrationBuilder.DropTable(
                name: "MapShapes");

            migrationBuilder.DropTable(
                name: "MapLayers");

            migrationBuilder.DropTable(
                name: "WorldMaps");
        }
    }
}
