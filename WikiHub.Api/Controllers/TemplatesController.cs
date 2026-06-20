using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Data;
using WikiHub.Api.Models;

namespace WikiHub.Api.Controllers;

// DTOs hứng dữ liệu từ React gửi lên
public class CreateTemplateDto
{
    public Guid WorldId { get; set; }
    public string Name { get; set; }
    public string HtmlContent { get; set; }
}

public class UpdateTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string HtmlContent { get; set; }
}

[Route("api/[controller]")]
[ApiController]
public class TemplatesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TemplatesController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Lấy danh sách Khuôn mẫu của một Thế giới
    [HttpGet]
    public async Task<IActionResult> GetTemplates([FromQuery] Guid worldId)
    {
        var templates = await _context.ArticleTemplates
            .Where(t => t.WorldId == worldId)
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { t.Id, t.Name, t.HtmlContent }) // Trả về cho FE dạng rút gọn
            .ToListAsync();

        return Ok(templates);
    }

    // 2. Lấy chi tiết 1 Khuôn mẫu để đưa vào Editor
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTemplate(Guid id)
    {
        var template = await _context.ArticleTemplates.FindAsync(id);
        if (template == null) return NotFound("Không tìm thấy Khuôn mẫu.");
        return Ok(template);
    }

    // 3. Tạo Khuôn mẫu mới
    [HttpPost]
    public async Task<IActionResult> CreateTemplate([FromBody] CreateTemplateDto dto)
    {
        var template = new ArticleTemplate
        {
            WorldId = dto.WorldId,
            Name = dto.Name,
            HtmlContent = dto.HtmlContent
        };

        _context.ArticleTemplates.Add(template);
        await _context.SaveChangesAsync();

        return Ok(template);
    }

    // 4. Cập nhật Khuôn mẫu (Lưu từ TemplateEditor)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateTemplateDto dto)
    {
        if (id != dto.Id) return BadRequest("ID không khớp.");

        var template = await _context.ArticleTemplates.FindAsync(id);
        if (template == null) return NotFound("Không tìm thấy Khuôn mẫu.");

        template.Name = dto.Name;
        template.HtmlContent = dto.HtmlContent;

        await _context.SaveChangesAsync();
        return Ok(new { message = "Cập nhật Khuôn mẫu thành công!" });
    }

    // 5. Xóa Khuôn mẫu
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTemplate(Guid id)
    {
        var template = await _context.ArticleTemplates.FindAsync(id);
        if (template == null) return NotFound();

        _context.ArticleTemplates.Remove(template);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}