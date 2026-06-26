namespace WikiHub.Api.Models;

public class MapShape
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LayerId { get; set; }

    // Loại hình: "freehand" | "rect" | "circle" | "polygon" | "text" | "line"
    public string Type { get; set; } = "freehand";

    // Dữ liệu hình học dạng JSON:
    // freehand → { points: [{x,y},...] }
    // rect     → { x, y, width, height }
    // circle   → { cx, cy, r }
    // polygon  → { points: [{x,y},...] }
    // text     → { x, y, text }
    // line     → { x1, y1, x2, y2 }
    public string Data { get; set; } = "{}";

    public string Color { get; set; } = "#3B8BD4";
    public float StrokeWidth { get; set; } = 2f;
    public float Opacity { get; set; } = 1f;
    public bool IsFilled { get; set; } = false;
    public string? FillColor { get; set; }
    public string? Label { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}