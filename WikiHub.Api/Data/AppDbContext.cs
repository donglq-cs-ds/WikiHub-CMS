using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Models;

namespace WikiHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // ── Bảng cũ ───────────────────────────────────────────────────────────────
    public DbSet<World> Worlds { get; set; } = null!;
    public DbSet<Article> Articles { get; set; } = null!;
    public DbSet<ArticleTemplate> ArticleTemplates { get; set; } = null!;

    // ── Bảng mới cho Map system ───────────────────────────────────────────────
    public DbSet<WorldMap> WorldMaps { get; set; } = null!;
    public DbSet<MapLayer> MapLayers { get; set; } = null!;
    public DbSet<MapShape> MapShapes { get; set; } = null!;
    public DbSet<MapPin> MapPins { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Xóa dây chuyền cũ: World → Article
        modelBuilder.Entity<Article>()
            .HasOne<World>()
            .WithMany()
            .HasForeignKey(a => a.WorldId)
            .OnDelete(DeleteBehavior.Cascade);

        // World → WorldMap (xóa world thì xóa hết map)
        modelBuilder.Entity<WorldMap>()
            .HasOne<World>()
            .WithMany()
            .HasForeignKey(m => m.WorldId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorldMap → MapLayer
        modelBuilder.Entity<MapLayer>()
            .HasOne<WorldMap>()
            .WithMany(m => m.Layers)
            .HasForeignKey(l => l.MapId)
            .OnDelete(DeleteBehavior.Cascade);

        // MapLayer → MapShape
        modelBuilder.Entity<MapShape>()
            .HasOne<MapLayer>()
            .WithMany(l => l.Shapes)
            .HasForeignKey(s => s.LayerId)
            .OnDelete(DeleteBehavior.Cascade);

        // MapPin thuộc MapId (không dùng LayerId FK vì layerIds là JSON array)
        // Dùng MapId để query pin theo map
        modelBuilder.Entity<MapPin>()
            .HasOne<WorldMap>()
            .WithMany()
            .HasForeignKey(p => p.MapId)
            .OnDelete(DeleteBehavior.Cascade);

        // MapPin.ArticleId là optional FK, không cascade (xóa article không xóa pin)
        modelBuilder.Entity<MapPin>()
            .HasOne<Article>()
            .WithMany()
            .HasForeignKey(p => p.ArticleId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}