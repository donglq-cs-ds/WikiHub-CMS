namespace WikiHub.Api.Models;

public class WorldMap
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorldId { get; set; }
    public string Title { get; set; } = "Bản đồ mới";
    public string? BackgroundImagePath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<MapLayer> Layers { get; set; } = new List<MapLayer>();
}