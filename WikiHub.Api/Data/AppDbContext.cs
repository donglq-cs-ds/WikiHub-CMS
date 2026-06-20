using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Models;

namespace WikiHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<World> Worlds { get; set; } = null!;
    public DbSet<Article> Articles { get; set; } = null!;
    public DbSet<ArticleTemplate> ArticleTemplates { get; set; } = null!;

    // HÀM XÓA DÂY CHUYỀN (PHẢI NẰM BÊN TRONG CLASS APP DBN CONTEXT)
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Thiết lập Xóa dây chuyền: Xóa World -> Tự động xóa sạch Article bên trong
        modelBuilder.Entity<Article>()
            .HasOne<World>()
            .WithMany()
            .HasForeignKey(a => a.WorldId)
            .OnDelete(DeleteBehavior.Cascade);
    }
} 