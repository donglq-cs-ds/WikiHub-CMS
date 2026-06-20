using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Data;
using WikiHub.Api.Models;
using WikiHub.Api.Models.DTOs;

namespace WikiHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TemplatesController : ControllerBase
{
    private readonly AppDbContext _context;

    public TemplatesController(AppDbContext context)
    {
        _context = context;
    }

    // 1. Lấy TOÀN BỘ Khuôn mẫu - dùng chung cho mọi Thế giới
    [HttpGet]
    public async Task<IActionResult> GetTemplates()
    {
        var templates = await _context.ArticleTemplates
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new { t.Id, t.Title, t.Description, t.Content })
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
            Title = dto.Title,
            Description = dto.Description,
            Content = dto.Content
        };

        _context.ArticleTemplates.Add(template);
        await _context.SaveChangesAsync();

        return Ok(template);
    }

    // 4. Cập nhật Khuôn mẫu (Lưu từ ArticleEditor khi isTemplate=true)
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTemplate(Guid id, [FromBody] UpdateTemplateDto dto)
    {
        if (id != dto.Id) return BadRequest("ID không khớp.");

        var template = await _context.ArticleTemplates.FindAsync(id);
        if (template == null) return NotFound("Không tìm thấy Khuôn mẫu.");

        template.Title = dto.Title;
        template.Description = dto.Description;
        template.Content = dto.Content;
        template.UpdatedAt = DateTime.UtcNow;

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