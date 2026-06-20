using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Models;

namespace WikiHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<World> Worlds { get; set; } = null!;
    public DbSet<Article> Articles { get; set; } = null!;
}
// 1. Entity (Lưu vào AppDbContext)
public class ArticleTemplate
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public string Name { get; set; } // Vd: "Nhân vật", "Vũ khí"
    public string HtmlContent { get; set; } // Chuỗi Tiptap HTML khổng lồ chứa InfoBox và Dàn bài
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}