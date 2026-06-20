using Microsoft.Extensions.FileProviders;
using Microsoft.EntityFrameworkCore;
using WikiHub.Api.Data;
using WikiHub.Api;

var builder = WebApplication.CreateBuilder(args);

// 1. Đăng ký Controllers
builder.Services.AddControllers();

// 2. Đăng ký DbContext (SQLite)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlite(connectionString));

// 3. Đăng ký CORS để Frontend React (Vite - port 5173) gọi được
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowReactApp");

var imagesPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images");
if (!Directory.Exists(imagesPath))
{
    Directory.CreateDirectory(imagesPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(imagesPath),
    RequestPath = "/images"
});

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate(); // nếu đang dùng EF Migrations
    SeedData.SeedTemplates(db);
}
app.UseAuthorization();

app.MapControllers();

app.Run();