using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Data;
using WikiHub.Api.DTOs;
using WikiHub.Api.Models;

namespace WikiHub.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class WorldsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public WorldsController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<WorldDto>>> GetWorlds(
        [FromQuery] string? searchTerm,
        [FromQuery] string sortBy = "CreatedAt",
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 11) // 11 thẻ + 1 nút thêm = 12 ô
    {
        var query = _context.Worlds.AsQueryable();

        // 1. Tìm kiếm (chống phân biệt hoa thường)
        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            var lowerTerm = searchTerm.ToLower();
            query = query.Where(w => w.Name.ToLower().Contains(lowerTerm));
        }

        // 2. Sắp xếp
        query = sortBy switch
        {
            "Name" => query.OrderBy(w => w.Name),
            "UpdatedAt" => query.OrderByDescending(w => w.UpdatedAt),
            _ => query.OrderByDescending(w => w.CreatedAt), // Mặc định mới nhất
        };

        // 3. Phân trang & Map sang DTO
        var totalItems = await query.CountAsync();
        var worlds = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(w => new WorldDto
            {
                Id = w.Id,
                Name = w.Name,
                Description = w.Description,
                ImagePath = w.ImagePath,
                CreatedAt = w.CreatedAt,
                UpdatedAt = w.UpdatedAt
            })
            .ToListAsync();

        return Ok(new PagedResult<WorldDto> { Items = worlds, TotalItems = totalItems, Page = page, PageSize = pageSize });
    }

    [HttpPost]
    public async Task<ActionResult<WorldDto>> CreateWorld([FromForm] CreateWorldDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest("Tên thế giới là bắt buộc.");

        var world = new World
        {
            Name = dto.Name,
            Description = dto.Description
        };

        // Xử lý hình ảnh
        if (dto.ImageFile != null)
        {
            if (dto.ImageFile.Length > 10 * 1024 * 1024) return BadRequest("Ảnh tối đa 10MB.");

            var uploadsFolder = Path.Combine(_env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "images");
            Directory.CreateDirectory(uploadsFolder); // Tự tạo thư mục nếu chưa có

            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.ImageFile.FileName);
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await dto.ImageFile.CopyToAsync(fileStream);
            }

            world.ImagePath = $"/images/{uniqueFileName}";
        }
        else if (!string.IsNullOrWhiteSpace(dto.ImageUrl))
        {
            world.ImagePath = dto.ImageUrl;
        }

        _context.Worlds.Add(world);
        await _context.SaveChangesAsync();

        return Ok(world); // Trả về HTTP 200 kèm data vừa tạo
    }
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteWorld(Guid id)
    {
        var world = await _context.Worlds.FindAsync(id);
        if (world == null) return NotFound("Không tìm thấy thế giới này.");

        // Clean Code: Dọn dẹp file ảnh trong ổ cứng nếu nó là ảnh upload
        if (!string.IsNullOrEmpty(world.ImagePath) && world.ImagePath.StartsWith("/images/"))
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var imagePath = Path.Combine(webRoot, world.ImagePath.TrimStart('/'));
            
            if (System.IO.File.Exists(imagePath))
            {
                System.IO.File.Delete(imagePath);
            }
        }

        _context.Worlds.Remove(world);
        await _context.SaveChangesAsync();

        return NoContent(); // Trả về 204: Xóa thành công
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<WorldDto>> GetWorld(Guid id)
    {
        var world = await _context.Worlds.FindAsync(id);
        
        if (world == null) return NotFound("Không tìm thấy thế giới này.");

        return Ok(new WorldDto
        {
            Id = world.Id,
            Name = world.Name,
            Description = world.Description,
            ImagePath = world.ImagePath,
            CreatedAt = world.CreatedAt,
            UpdatedAt = world.UpdatedAt
        });
    }
}
