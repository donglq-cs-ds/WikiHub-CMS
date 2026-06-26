namespace WikiHub.Api.Models;

public class MapLayer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MapId { get; set; }
    public string Name { get; set; } = "Layer mới";
    public int Order { get; set; } = 0;         // Thứ tự hiển thị (0 = dưới cùng)
    public bool IsVisibleByDefault { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<MapShape> Shapes { get; set; } = new List<MapShape>();
    public ICollection<MapPin> Pins { get; set; } = new List<MapPin>();
}