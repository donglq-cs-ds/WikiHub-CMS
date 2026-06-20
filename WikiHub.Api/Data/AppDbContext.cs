using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Models;

namespace WikiHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<World> Worlds { get; set; } = null!;
    public DbSet<Article> Articles { get; set; } = null!;
    public DbSet<ArticleTemplate> ArticleTemplates { get; set; }
}