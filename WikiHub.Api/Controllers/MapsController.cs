using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using WikiHub.Api.Data;
using WikiHub.Api.Models;
using WikiHub.Api.Models.DTOs;

namespace WikiHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MapsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public MapsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // WORLD MAP — Danh sách & CRUD
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/maps?worldId=...
    // Trả về danh sách map của 1 world (sidebar), không kèm shapes để nhẹ
    [HttpGet]
    public async Task<IActionResult> GetMaps([FromQuery] Guid worldId)
    {
        var maps = await _context.WorldMaps
            .Where(m => m.WorldId == worldId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => new
            {
                m.Id,
                m.WorldId,
                m.Title,
                m.BackgroundImagePath,
                m.CreatedAt,
                m.UpdatedAt,
                LayerCount = m.Layers.Count
            })
            .ToListAsync();

        return Ok(maps);
    }

    // GET /api/maps/{id}
    // Trả về full map kèm tất cả layers + shapes + pins (dùng khi mở map)
    [HttpGet("{id}")]
    public async Task<IActionResult> GetMap(Guid id)
    {
        var map = await _context.WorldMaps
            .Include(m => m.Layers)
                .ThenInclude(l => l.Shapes)
            .Include(m => m.Layers)
                .ThenInclude(l => l.Pins)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (map == null) return NotFound("Không tìm thấy bản đồ.");

        // Join article info cho từng pin
        var articleIds = map.Layers
            .SelectMany(l => l.Pins)
            .Where(p => p.ArticleId.HasValue)
            .Select(p => p.ArticleId!.Value)
            .Distinct()
            .ToList();

        var articles = await _context.Articles
            .Where(a => articleIds.Contains(a.Id))
            .Select(a => new { a.Id, a.Title, a.Type, a.ImagePath })
            .ToDictionaryAsync(a => a.Id);

        var dto = new WorldMapDto
        {
            Id = map.Id,
            WorldId = map.WorldId,
            Title = map.Title,
            BackgroundImagePath = map.BackgroundImagePath,
            CreatedAt = map.CreatedAt,
            UpdatedAt = map.UpdatedAt,
            Layers = map.Layers
                .OrderBy(l => l.Order)
                .Select(l => new MapLayerDto
                {
                    Id = l.Id,
                    MapId = l.MapId,
                    Name = l.Name,
                    Order = l.Order,
                    IsVisibleByDefault = l.IsVisibleByDefault,
                    Shapes = l.Shapes.Select(s => new MapShapeDto
                    {
                        Id = s.Id,
                        LayerId = s.LayerId,
                        Type = s.Type,
                        Data = s.Data,
                        Color = s.Color,
                        StrokeWidth = s.StrokeWidth,
                        Opacity = s.Opacity,
                        IsFilled = s.IsFilled,
                        FillColor = s.FillColor,
                        Label = s.Label
                    }).ToList(),
                    Pins = l.Pins.Select(p =>
                    {
                        var layerIds = ParseGuids(p.LayerIds);
                        articles.TryGetValue(p.ArticleId ?? Guid.Empty, out var art);
                        return new MapPinDto
                        {
                            Id = p.Id,
                            MapId = p.MapId,
                            LayerIds = layerIds,
                            ArticleId = p.ArticleId,
                            X = p.X,
                            Y = p.Y,
                            Label = p.Label,
                            PinType = p.PinType,
                            Color = p.Color,
                            ArticleTitle = art?.Title,
                            ArticleType = art?.Type,
                            ArticleImagePath = art?.ImagePath
                        };
                    }).ToList()
                }).ToList()
        };

        return Ok(dto);
    }

    // POST /api/maps?worldId=...
    [HttpPost]
    public async Task<IActionResult> CreateMap([FromQuery] Guid worldId, [FromBody] CreateMapDto dto)
    {
        var worldExists = await _context.Worlds.AnyAsync(w => w.Id == worldId);
        if (!worldExists) return BadRequest("Không tìm thấy World.");

        var map = new WorldMap
        {
            WorldId = worldId,
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Bản đồ mới" : dto.Title
        };

        // Tự tạo 1 layer mặc định khi tạo map mới
        map.Layers.Add(new MapLayer { Name = "Layer 1", Order = 0 });

        _context.WorldMaps.Add(map);
        await _context.SaveChangesAsync();

        return Ok(new { map.Id, map.WorldId, map.Title, map.CreatedAt });
    }

    // PUT /api/maps/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMap(Guid id, [FromBody] UpdateMapDto dto)
    {
        if (id != dto.Id) return BadRequest("ID không khớp.");
        var map = await _context.WorldMaps.FindAsync(id);
        if (map == null) return NotFound();

        map.Title = dto.Title;
        map.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật thành công." });
    }

    // DELETE /api/maps/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMap(Guid id)
    {
        var map = await _context.WorldMaps.FindAsync(id);
        if (map == null) return NotFound();

        // Xóa ảnh nền nếu có
        DeleteImageFile(map.BackgroundImagePath);

        _context.WorldMaps.Remove(map);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/maps/{id}/background
    // Upload ảnh nền cho map
    [HttpPost("{id}/background")]
    public async Task<IActionResult> UploadBackground(Guid id, [FromForm] IFormFile ImageFile)
    {
        var map = await _context.WorldMaps.FindAsync(id);
        if (map == null) return NotFound();
        if (ImageFile == null || ImageFile.Length == 0) return BadRequest("Không có file.");

        // Xóa ảnh cũ nếu có
        DeleteImageFile(map.BackgroundImagePath);

        var uploadsFolder = Path.Combine(
            _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
            "images");
        Directory.CreateDirectory(uploadsFolder);

        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(ImageFile.FileName);
        var filePath = Path.Combine(uploadsFolder, fileName);

        using (var stream = new FileStream(filePath, FileMode.Create))
            await ImageFile.CopyToAsync(stream);

        map.BackgroundImagePath = $"/images/{fileName}";
        map.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { url = map.BackgroundImagePath });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // LAYER
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/maps/{mapId}/layers
    [HttpPost("{mapId}/layers")]
    public async Task<IActionResult> CreateLayer(Guid mapId, [FromBody] CreateLayerDto dto)
    {
        var mapExists = await _context.WorldMaps.AnyAsync(m => m.Id == mapId);
        if (!mapExists) return BadRequest("Không tìm thấy Map.");

        var layer = new MapLayer
        {
            MapId = mapId,
            Name = dto.Name,
            Order = dto.Order,
            IsVisibleByDefault = dto.IsVisibleByDefault
        };

        _context.MapLayers.Add(layer);
        await _context.SaveChangesAsync();

        return Ok(new MapLayerDto
        {
            Id = layer.Id,
            MapId = layer.MapId,
            Name = layer.Name,
            Order = layer.Order,
            IsVisibleByDefault = layer.IsVisibleByDefault
        });
    }

    // PUT /api/maps/{mapId}/layers/{layerId}
    [HttpPut("{mapId}/layers/{layerId}")]
    public async Task<IActionResult> UpdateLayer(Guid mapId, Guid layerId, [FromBody] UpdateLayerDto dto)
    {
        var layer = await _context.MapLayers
            .FirstOrDefaultAsync(l => l.Id == layerId && l.MapId == mapId);
        if (layer == null) return NotFound();

        layer.Name = dto.Name;
        layer.Order = dto.Order;
        layer.IsVisibleByDefault = dto.IsVisibleByDefault;
        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật layer thành công." });
    }

    // DELETE /api/maps/{mapId}/layers/{layerId}
    [HttpDelete("{mapId}/layers/{layerId}")]
    public async Task<IActionResult> DeleteLayer(Guid mapId, Guid layerId)
    {
        var layer = await _context.MapLayers
            .FirstOrDefaultAsync(l => l.Id == layerId && l.MapId == mapId);
        if (layer == null) return NotFound();

        _context.MapLayers.Remove(layer);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // SHAPE — Upsert toàn bộ shapes của 1 layer 1 lần
    // ═══════════════════════════════════════════════════════════════════════════

    // PUT /api/maps/{mapId}/layers/{layerId}/shapes
    // Frontend gửi toàn bộ shapes hiện tại → backend replace all
    // Lý do dùng replace-all thay vì patch từng shape:
    // Khi vẽ freehand, user tạo hàng chục shape/giây → quá nhiều request nếu patch từng cái
    [HttpPut("{mapId}/layers/{layerId}/shapes")]
    public async Task<IActionResult> UpsertShapes(Guid mapId, Guid layerId, [FromBody] UpsertShapesDto dto)
    {
        var layer = await _context.MapLayers
            .Include(l => l.Shapes)
            .FirstOrDefaultAsync(l => l.Id == layerId && l.MapId == mapId);
        if (layer == null) return NotFound();

        // Xóa sạch shapes cũ
        _context.MapShapes.RemoveRange(layer.Shapes);

        // Thêm shapes mới
        var now = DateTime.UtcNow;
        foreach (var payload in dto.Shapes)
        {
            layer.Shapes.Add(new MapShape
            {
                Id = payload.Id ?? Guid.NewGuid(),
                LayerId = layerId,
                Type = payload.Type,
                Data = payload.Data,
                Color = payload.Color,
                StrokeWidth = payload.StrokeWidth,
                Opacity = payload.Opacity,
                IsFilled = payload.IsFilled,
                FillColor = payload.FillColor,
                Label = payload.Label,
                CreatedAt = now,
                UpdatedAt = now
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = "Lưu shapes thành công.", count = dto.Shapes.Count });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PIN
    // ═══════════════════════════════════════════════════════════════════════════

    // POST /api/maps/{mapId}/pins
    [HttpPost("{mapId}/pins")]
    public async Task<IActionResult> CreatePin(Guid mapId, [FromBody] CreatePinDto dto)
    {
        var mapExists = await _context.WorldMaps.AnyAsync(m => m.Id == mapId);
        if (!mapExists) return BadRequest("Không tìm thấy Map.");

        // Lấy layer đầu tiên làm mặc định nếu không truyền layerIds
        if (!dto.LayerIds.Any())
        {
            var firstLayer = await _context.MapLayers
                .Where(l => l.MapId == mapId)
                .OrderBy(l => l.Order)
                .Select(l => l.Id)
                .FirstOrDefaultAsync();
            if (firstLayer != Guid.Empty) dto.LayerIds.Add(firstLayer);
        }

        var pin = new MapPin
        {
            MapId = mapId,
            LayerIds = JsonSerializer.Serialize(dto.LayerIds),
            ArticleId = dto.ArticleId,
            X = dto.X,
            Y = dto.Y,
            Label = dto.Label,
            PinType = dto.PinType,
            Color = dto.Color
        };

        _context.MapPins.Add(pin);
        await _context.SaveChangesAsync();

        return Ok(new MapPinDto
        {
            Id = pin.Id,
            MapId = pin.MapId,
            LayerIds = dto.LayerIds,
            ArticleId = pin.ArticleId,
            X = pin.X,
            Y = pin.Y,
            Label = pin.Label,
            PinType = pin.PinType,
            Color = pin.Color
        });
    }

    // PUT /api/maps/{mapId}/pins/{pinId}
    [HttpPut("{mapId}/pins/{pinId}")]
    public async Task<IActionResult> UpdatePin(Guid mapId, Guid pinId, [FromBody] UpdatePinDto dto)
    {
        var pin = await _context.MapPins
            .FirstOrDefaultAsync(p => p.Id == pinId && p.MapId == mapId);
        if (pin == null) return NotFound();

        pin.LayerIds = JsonSerializer.Serialize(dto.LayerIds);
        pin.ArticleId = dto.ArticleId;
        pin.X = dto.X;
        pin.Y = dto.Y;
        pin.Label = dto.Label;
        pin.PinType = dto.PinType;
        pin.Color = dto.Color;
        pin.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật pin thành công." });
    }

    // DELETE /api/maps/{mapId}/pins/{pinId}
    [HttpDelete("{mapId}/pins/{pinId}")]
    public async Task<IActionResult> DeletePin(Guid mapId, Guid pinId)
    {
        var pin = await _context.MapPins
            .FirstOrDefaultAsync(p => p.Id == pinId && p.MapId == mapId);
        if (pin == null) return NotFound();

        _context.MapPins.Remove(pin);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MINI-MAP — Dùng cho ArticleReader (link 2 chiều article → map)
    // ═══════════════════════════════════════════════════════════════════════════

    // GET /api/maps/article/{articleId}/pins
    // Trả về tất cả pin liên kết với 1 bài viết, kèm thông tin map
    // ArticleReader dùng endpoint này để render MiniMapWidget
    [HttpGet("article/{articleId}/pins")]
    public async Task<IActionResult> GetPinsByArticle(Guid articleId)
    {
        var pins = await _context.MapPins
            .Where(p => p.ArticleId == articleId)
            .ToListAsync();

        if (!pins.Any()) return Ok(new ArticlePinsDto { ArticleId = articleId });

        var mapIds = pins.Select(p => p.MapId).Distinct().ToList();
        var maps = await _context.WorldMaps
            .Where(m => mapIds.Contains(m.Id))
            .Select(m => new { m.Id, m.Title, m.BackgroundImagePath })
            .ToDictionaryAsync(m => m.Id);

        var result = new ArticlePinsDto
        {
            ArticleId = articleId,
            Pins = pins.Select(p =>
            {
                maps.TryGetValue(p.MapId, out var map);
                return new ArticlePinLocationDto
                {
                    PinId = p.Id,
                    MapId = p.MapId,
                    MapTitle = map?.Title ?? "Bản đồ",
                    MapBackgroundImagePath = map?.BackgroundImagePath,
                    X = p.X,
                    Y = p.Y,
                    Label = p.Label
                };
            }).ToList()
        };

        return Ok(result);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════════════════════

    private static List<Guid> ParseGuids(string json)
    {
        try { return JsonSerializer.Deserialize<List<Guid>>(json) ?? new(); }
        catch { return new(); }
    }

    private void DeleteImageFile(string? imagePath)
    {
        if (string.IsNullOrEmpty(imagePath) || !imagePath.StartsWith("/images/")) return;
        var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
        var fullPath = Path.Combine(webRoot, imagePath.TrimStart('/'));
        if (System.IO.File.Exists(fullPath)) System.IO.File.Delete(fullPath);
    }
}