namespace WikiHub.Api.DTOs;

public class ArticleDto
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; }
    public string Type { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public bool IsOverview { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateArticleDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = string.Empty;
    public IFormFile? ImageFile { get; set; }
    public string? ImageUrl { get; set; }
    public bool IsOverview { get; set; } = false;
}