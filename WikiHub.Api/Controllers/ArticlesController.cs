using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Data;
using WikiHub.Api.DTOs;
using WikiHub.Api.Models;
using WikiHub.Api.Models.DTOs;

namespace WikiHub.Api.Controllers;

// 1. ĐƯA DTO LÊN ĐÂY, TRÁNH ĐƯỜNG CỦA CONTROLLER

// 2. TRẢ LẠI CHỦ QUYỀN VÀ ĐỊA CHỈ CHO CONTROLLER
[Route("api/[controller]")]
[ApiController]
public class ArticlesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public ArticlesController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<List<ArticleDto>>> GetArticles(
        [FromQuery] Guid worldId,
        [FromQuery] string? type,
        [FromQuery] bool? isOverview,
        [FromQuery] string sortBy = "CreatedAt")
    {
        var query = _context.Articles.Where(a => a.WorldId == worldId);

        if (isOverview.HasValue && isOverview.Value)
        {
            query = query.Where(a => a.IsOverview == true);
        }
        else if (!string.IsNullOrWhiteSpace(type))
        {
            query = query.Where(a => a.Type == type && a.IsOverview == false);
        }

        query = sortBy switch
        {
            "Title" => query.OrderBy(a => a.Title),
            "UpdatedAt" => query.OrderByDescending(a => a.UpdatedAt),
            _ => query.OrderByDescending(a => a.CreatedAt)
        };

        var articles = await query
            .Select(a => new ArticleDto
            {
                Id = a.Id,
                WorldId = a.WorldId,
                Title = a.Title,
                Description = a.Description,
                Type = a.Type,
                ImagePath = a.ImagePath,
                IsOverview = a.IsOverview,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            }).ToListAsync();

        return Ok(articles);
    }

    // ── Endpoint cho @mention search ────────────────────────────────────────
    // FE gọi: GET /api/articles/search?q=...&worldId=...
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] Guid worldId)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<object>());

        var results = await _context.Articles
            .Where(a => a.WorldId == worldId && a.Title.Contains(q))
            .OrderBy(a => a.Title)
            .Take(5)
            .Select(a => new { id = a.Id.ToString(), title = a.Title })
            .ToListAsync();

        return Ok(results);
    }

    [HttpPost]
    public async Task<ActionResult<ArticleDto>> CreateArticle([FromForm] Guid worldId, [FromForm] CreateArticleDto dto)
    {
        var article = new Article
        {
            WorldId = worldId,
            Title = string.IsNullOrWhiteSpace(dto.Title) ? "Bài viết mới" : dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            IsOverview = dto.IsOverview
        };

        if (dto.ImageFile != null)
        {
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images");
            Directory.CreateDirectory(uploadsFolder);
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.ImageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await dto.ImageFile.CopyToAsync(fileStream);
            }
            article.ImagePath = $"/images/{uniqueFileName}";
        }
        else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            article.ImagePath = dto.ImageUrl;
        }

        _context.Articles.Add(article);
        await _context.SaveChangesAsync();
        return Ok(article);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArticle(Guid id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null) return NotFound();

        if (!string.IsNullOrEmpty(article.ImagePath) && article.ImagePath.StartsWith("/images/"))
        {
            var imagePath = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), article.ImagePath.TrimStart('/'));
            if (System.IO.File.Exists(imagePath)) System.IO.File.Delete(imagePath);
        }

        _context.Articles.Remove(article);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ArticleDto>> GetArticle(Guid id)
    {
        var article = await _context.Articles.FindAsync(id);
        if (article == null) return NotFound("Không tìm thấy bài viết.");

        return Ok(new ArticleDto
        {
            Id = article.Id,
            WorldId = article.WorldId,
            Title = article.Title,
            Description = article.Description,
            Content = article.Content,
            Type = article.Type,
            ImagePath = article.ImagePath,
            IsOverview = article.IsOverview,
            CreatedAt = article.CreatedAt,
            UpdatedAt = article.UpdatedAt
        });
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArticle(Guid id, [FromBody] ArticleUpdateDto dto)
    {
        // Kiểm tra xem ID trên URL và ID trong Body có khớp nhau không
        if (id != dto.Id)
        {
            return BadRequest("ID bài viết không khớp.");
        }

        var article = await _context.Articles.FindAsync(id);
        if (article == null)
        {
            return NotFound("Không tìm thấy bài viết trong Database.");
        }

        // Cập nhật dữ liệu
        article.Title = dto.Title;
        article.Content = dto.Content;
        article.UpdatedAt = DateTime.UtcNow; // Tự động cập nhật giờ sửa

        try
        {
            await _context.SaveChangesAsync();
            return Ok(new { message = "Lưu thành công!" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi Server: {ex.Message}");
        }
    }
    [HttpPost("upload-image")]
    public async Task<IActionResult> UploadImage([FromForm] IFormFile ImageFile)
    {
        if (ImageFile == null || ImageFile.Length == 0)
        {
            return BadRequest("Không có file nào được tải lên.");
        }

        try
        {
            // Tạo thư mục wwwroot/images nếu chưa có
            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images");
            Directory.CreateDirectory(uploadsFolder);

            // Sinh tên file độc nhất để không bị trùng
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(ImageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Lưu file xuống ổ cứng
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await ImageFile.CopyToAsync(fileStream);
            }

            // Trả về đường dẫn thật cho Frontend dùng (Ví dụ: /images/12345-abcde.png)
            var fileUrl = $"/images/{uniqueFileName}";
            
            return Ok(new { url = fileUrl });
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Lỗi khi lưu ảnh: {ex.Message}");
        }
    }
}