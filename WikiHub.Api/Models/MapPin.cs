namespace WikiHub.Api.Models;

public class MapPin
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MapId { get; set; }

    // JSON array các LayerId pin này xuất hiện, vd: ["id1","id2"]
    // Dùng string thay vì bảng junction để đơn giản hóa
    public string LayerIds { get; set; } = "[]";

    // Liên kết bài viết (nullable: pin có thể chỉ là nhãn địa lý)
    public Guid? ArticleId { get; set; }

    // Tọa độ % so với kích thước canvas (0.0 → 1.0)
    // Dùng % để bản đồ responsive không bị lệch khi resize
    public float X { get; set; }
    public float Y { get; set; }

    public string Label { get; set; } = string.Empty;

    // Loại pin: "location" | "city" | "dungeon" | "event" | "character" | "custom"
    public string PinType { get; set; } = "location";

    public string Color { get; set; } = "#E24B4A";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}