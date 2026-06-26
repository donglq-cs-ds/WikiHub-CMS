namespace WikiHub.Api.Models.DTOs;

// ── WorldMap ──────────────────────────────────────────────────────────────────

public class WorldMapDto
{
    public Guid Id { get; set; }
    public Guid WorldId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? BackgroundImagePath { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public List<MapLayerDto> Layers { get; set; } = new();
}

public class CreateMapDto
{
    public string Title { get; set; } = "Bản đồ mới";
}

public class UpdateMapDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
}

// ── MapLayer ──────────────────────────────────────────────────────────────────

public class MapLayerDto
{
    public Guid Id { get; set; }
    public Guid MapId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsVisibleByDefault { get; set; }
    public List<MapShapeDto> Shapes { get; set; } = new();
    public List<MapPinDto> Pins { get; set; } = new();
}

public class CreateLayerDto
{
    public string Name { get; set; } = "Layer mới";
    public int Order { get; set; } = 0;
    public bool IsVisibleByDefault { get; set; } = true;
}

public class UpdateLayerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Order { get; set; }
    public bool IsVisibleByDefault { get; set; }
}

// ── MapShape ──────────────────────────────────────────────────────────────────

public class MapShapeDto
{
    public Guid Id { get; set; }
    public Guid LayerId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = "{}";
    public string Color { get; set; } = "#3B8BD4";
    public float StrokeWidth { get; set; }
    public float Opacity { get; set; }
    public bool IsFilled { get; set; }
    public string? FillColor { get; set; }
    public string? Label { get; set; }
}

public class UpsertShapesDto
{
    // Gửi toàn bộ shapes của 1 layer lên 1 lần (replace all)
    // Tránh gọi API từng shape → quá nhiều request khi đang vẽ
    public List<ShapePayload> Shapes { get; set; } = new();
}

public class ShapePayload
{
    public Guid? Id { get; set; }   // null = tạo mới, có giá trị = cập nhật
    public string Type { get; set; } = string.Empty;
    public string Data { get; set; } = "{}";
    public string Color { get; set; } = "#3B8BD4";
    public float StrokeWidth { get; set; } = 2f;
    public float Opacity { get; set; } = 1f;
    public bool IsFilled { get; set; } = false;
    public string? FillColor { get; set; }
    public string? Label { get; set; }
}

// ── MapPin ────────────────────────────────────────────────────────────────────

public class MapPinDto
{
    public Guid Id { get; set; }
    public Guid MapId { get; set; }
    public List<Guid> LayerIds { get; set; } = new();
    public Guid? ArticleId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public string Label { get; set; } = string.Empty;
    public string PinType { get; set; } = "location";
    public string Color { get; set; } = "#E24B4A";

    // Thông tin bài viết liên kết (join khi query, tiện cho frontend)
    public string? ArticleTitle { get; set; }
    public string? ArticleType { get; set; }
    public string? ArticleImagePath { get; set; }
}

public class CreatePinDto
{
    public List<Guid> LayerIds { get; set; } = new();
    public Guid? ArticleId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public string Label { get; set; } = string.Empty;
    public string PinType { get; set; } = "location";
    public string Color { get; set; } = "#E24B4A";
}

public class UpdatePinDto
{
    public Guid Id { get; set; }
    public List<Guid> LayerIds { get; set; } = new();
    public Guid? ArticleId { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public string Label { get; set; } = string.Empty;
    public string PinType { get; set; } = "location";
    public string Color { get; set; } = "#E24B4A";
}

// ── Mini-map (dùng cho ArticleReader) ────────────────────────────────────────

public class ArticlePinsDto
{
    // Trả về tất cả pin liên kết với 1 article, kèm thông tin map
    public Guid ArticleId { get; set; }
    public List<ArticlePinLocationDto> Pins { get; set; } = new();
}

public class ArticlePinLocationDto
{
    public Guid PinId { get; set; }
    public Guid MapId { get; set; }
    public string MapTitle { get; set; } = string.Empty;
    public string? MapBackgroundImagePath { get; set; }
    public float X { get; set; }
    public float Y { get; set; }
    public string Label { get; set; } = string.Empty;
}