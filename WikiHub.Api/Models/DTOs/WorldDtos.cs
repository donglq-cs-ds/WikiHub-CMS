namespace WikiHub.Api.DTOs;

public class WorldDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? ImagePath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateWorldDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public IFormFile? ImageFile { get; set; } // Dùng IFormFile để nhận file từ máy
    public string? ImageUrl { get; set; }
}

public class PagedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalItems { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}