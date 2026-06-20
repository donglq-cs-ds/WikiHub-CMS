namespace WikiHub.Api.Models;

public class Article
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorldId { get; set; } // Khóa ngoại liên kết với Thế giới
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Content { get; set; } // Nội dung chi tiết (Sẽ xử lý sau)
    public string Type { get; set; } = string.Empty; // Lưu tên loại: Nhân vật, Gia tộc/Dòng họ...
    public string? ImagePath { get; set; }
    public bool IsOverview { get; set; } = false; // Cờ đánh dấu bài Tổng quan của Thế giới
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}