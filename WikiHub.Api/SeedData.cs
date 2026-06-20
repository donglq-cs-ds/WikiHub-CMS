using System.Text.Json;
using WikiHub.Api.Data;
using WikiHub.Api.Models;

namespace WikiHub.Api;

// ============================================================================
// SeedData: tự động tạo 36 Khuôn mẫu mặc định (1 Tổng quan + 35 loại bài viết)
// mỗi khi Backend khởi động, NẾU bảng ArticleTemplates còn trống.
//
// CÁCH DÙNG:
//   1. Copy file này vào folder WikiHub.Api (cùng cấp với Program.cs)
//   2. Trong Program.cs, sau dòng "var app = builder.Build();" và TRƯỚC
//      "app.Run();", thêm đoạn:
//
//          using (var scope = app.Services.CreateScope())
//          {
//              var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
//              db.Database.Migrate(); // nếu đang dùng EF Migrations
//              SeedData.SeedTemplates(db);
//          }
//
//   3. Nếu trước đó đã chạy node seed-templates.mjs rồi (đã có data cũ),
//      cần xóa hết bảng ArticleTemplates trước (vd: DELETE FROM ArticleTemplates
//      hoặc xóa DB làm lại migrate), vì SeedTemplates() sẽ bỏ qua nếu bảng
//      không trống.
// ============================================================================

public static class SeedData
{
    public static void SeedTemplates(AppDbContext context)
    {
        if (context.ArticleTemplates.Any())
        {
            return; // đã có dữ liệu rồi, không seed lại để tránh trùng
        }

        var templates = new List<TemplateDef>
        {
            new("Tổng quan thế giới", "Khuôn mẫu cho bài Tổng quan giới thiệu thế giới",
                new[] { "Tên thế giới", "Thể loại", "Số quốc gia", "Mốc thời gian hiện tại", "Chủ đề chính", "Tình trạng phát triển" },
                new[] { "Mô Tả", "Vũ Trụ Quan", "Địa Lý Toàn Cảnh", "Lịch Sử Toàn Cảnh", "Chủng Tộc & Văn Minh", "Chính Trị Toàn Cảnh", "Tôn Giáo & Tín Ngưỡng", "Hệ Thống Sức Mạnh", "Chủ Đề & Thông Điệp" }),

            // 1. Nhân vật & Xã hội
            new("Nhân vật", "Khuôn mẫu cho bài viết Nhân vật",
                new[] { "Tên đầy đủ", "Biệt danh", "Chủng tộc", "Giới tính", "Chiều cao/Cân nặng", "Đặc điểm", "Trạng thái", "Tổ chức", "Chức vụ", "Năng lực", "Đánh giá" },
                new[] { "Mô Tả", "Ngoại Hình", "Tính Cách", "Tiểu Sử", "Tâm Lý", "Sức Mạnh", "Mối Quan Hệ" }),
            new("Gia tộc/Dòng họ", "Khuôn mẫu cho bài viết Gia tộc/Dòng họ",
                new[] { "Tên gia tộc", "Huy hiệu", "Chủng tộc", "Lãnh địa", "Người đứng đầu", "Quy mô", "Đồng minh", "Trạng thái" },
                new[] { "Mô Tả", "Lịch Sử", "Thành Viên", "Truyền Thống", "Quan Hệ" }),
            new("Chủng tộc/Sắc tộc", "Khuôn mẫu cho bài viết Chủng tộc/Sắc tộc",
                new[] { "Tên gọi khác", "Phân loại", "Nguồn gốc", "Dân số", "Tuổi thọ", "Giới tính", "Ngôn ngữ", "Tín ngưỡng", "Trạng thái" },
                new[] { "Mô Tả", "Ngoại Hình", "Sinh Học", "Năng Lực", "Văn Hóa", "Lịch Sử", "Phân Bố" }),
            new("Nghề nghiệp/Ngành nghề", "Khuôn mẫu cho bài viết Nghề nghiệp/Ngành nghề",
                new[] { "Tên nghề", "Loại", "Yêu cầu", "Khu vực phổ biến", "Thu nhập", "Tổ chức liên quan", "Trạng thái" },
                new[] { "Mô Tả", "Công Việc", "Đào Tạo", "Đẳng Cấp/Vị Thế", "Lịch Sử" }),

            // 2. Chính trị & Quân sự
            new("Quốc gia", "Khuôn mẫu cho bài viết Quốc gia",
                new[] { "Tên đầy đủ", "Thủ đô", "Chính thể", "Người lãnh đạo", "Dân số & Diện tích", "Tôn giáo", "Tiền tệ", "Đồng minh", "Trạng thái" },
                new[] { "Mô Tả", "Địa Lý", "Chính Trị", "Kinh Tế", "Quân Sự", "Văn Hóa", "Lịch Sử" }),
            new("Phe phái/Tổ chức", "Khuôn mẫu cho bài viết Phe phái/Tổ chức",
                new[] { "Tên đầy đủ", "Loại", "Trụ sở", "Lãnh đạo", "Quy mô", "Mục tiêu", "Trực thuộc", "Trạng thái" },
                new[] { "Mô Tả", "Cơ Cấu", "Tư Tưởng", "Hoạt Động", "Lịch Sử" }),
            new("Quân đội", "Khuôn mẫu cho bài viết Quân đội",
                new[] { "Tên đơn vị", "Loại", "Quốc gia/Tổ chức", "Quân số", "Chỉ huy", "Trang bị", "Đồn trú", "Trạng thái" },
                new[] { "Mô Tả", "Cơ Cấu", "Trang Bị & Chiến Thuật", "Chiến Tích", "Lịch Sử" }),
            new("Xung đột", "Khuôn mẫu cho bài viết Xung đột",
                new[] { "Tên xung đột", "Loại", "Thời gian", "Các bên tham chiến", "Nguyên nhân", "Kết quả", "Quy mô", "Trạng thái" },
                new[] { "Mô Tả", "Bối Cảnh", "Diễn Biến", "Các Trận Chiến", "Hậu Quả", "Tác Động" }),
            new("Trận chiến", "Khuôn mẫu cho bài viết Trận chiến",
                new[] { "Tên trận chiến", "Thuộc xung đột", "Thời gian", "Địa điểm", "Các bên", "Chỉ huy", "Kết quả", "Quy mô" },
                new[] { "Mô Tả", "Bối Cảnh", "Diễn Biến", "Kết Quả", "Tổn Thất" }),
            new("Sự kiện", "Khuôn mẫu cho bài viết Sự kiện",
                new[] { "Tên sự kiện", "Loại", "Thời gian", "Địa điểm", "Bên liên quan", "Nguyên nhân", "Kết quả", "Quy mô" },
                new[] { "Mô Tả", "Bối Cảnh", "Diễn Biến", "Hậu Quả", "Tác Động" }),

            // 3. Địa lý & Không gian
            new("Địa lý", "Khuôn mẫu cho bài viết Địa lý",
                new[] { "Tên địa điểm", "Loại", "Quốc gia", "Dân số", "Khí hậu", "Lãnh đạo", "Kiểm soát", "Tầm quan trọng" },
                new[] { "Mô Tả", "Địa Lý", "Kiến Trúc", "Văn Hóa", "Lịch Sử" }),
            new("Khu định cư", "Khuôn mẫu cho bài viết Khu định cư",
                new[] { "Tên khu định cư", "Loại", "Quốc gia", "Dân số", "Lãnh đạo", "Kinh tế", "Phòng thủ", "Tầm quan trọng" },
                new[] { "Mô Tả", "Địa Lý", "Kiến Trúc", "Dân Cư & Văn Hóa", "Kinh Tế", "Lịch Sử" }),
            new("Công trình", "Khuôn mẫu cho bài viết Công trình",
                new[] { "Tên công trình", "Loại", "Vị trí", "Chủ sở hữu", "Niên đại", "Kiến trúc", "Công dụng", "Trạng thái" },
                new[] { "Mô Tả", "Kiến Trúc", "Công Dụng", "Lịch Sử", "Truyền Thuyết" }),
            new("Phương tiện giao thông", "Khuôn mẫu cho bài viết Phương tiện giao thông",
                new[] { "Tên phương tiện", "Loại", "Xuất xứ", "Sức chứa", "Tốc độ", "Nhiên liệu/Động lực", "Chủ sở hữu", "Trạng thái" },
                new[] { "Mô Tả", "Thiết Kế", "Vận Hành", "Lịch Sử", "Chủ Sở Hữu" }),
            new("Cõi giới/Chiều không gian", "Khuôn mẫu cho bài viết Cõi giới/Chiều không gian",
                new[] { "Tên cõi giới", "Loại", "Vị trí tương đối", "Cư dân", "Quy luật vận hành", "Lối vào", "Người cai quản", "Trạng thái" },
                new[] { "Mô Tả", "Đặc Điểm", "Quy Luật", "Cư Dân", "Cách Tiếp Cận", "Lịch Sử" }),

            // 4. Sinh vật & Tự nhiên
            new("Loài", "Khuôn mẫu cho bài viết Loài (Sinh vật học)",
                new[] { "Tên loài", "Danh pháp", "Môi trường sống", "Phân bố", "Kích thước", "Nguy hiểm", "Trạng thái" },
                new[] { "Mô Tả", "Ngoại Hình", "Tập Tính", "Năng Lực", "Sinh Sản" }),
            new("Thực vật", "Khuôn mẫu cho bài viết Thực vật",
                new[] { "Tên loài", "Danh pháp", "Môi trường sống", "Phân bố", "Công dụng", "Độc tính", "Độ hiếm", "Trạng thái" },
                new[] { "Mô Tả", "Đặc Điểm", "Sinh Trưởng", "Công Dụng", "Phân Bố" }),
            new("Quái vật", "Khuôn mẫu cho bài viết Quái vật",
                new[] { "Tên gọi", "Phân loại", "Môi trường sống", "Kích thước", "Mức độ nguy hiểm", "Năng lực", "Điểm yếu", "Trạng thái" },
                new[] { "Mô Tả", "Ngoại Hình", "Tập Tính", "Năng Lực", "Cách Đối Phó", "Nguồn Gốc" }),
            new("Sinh vật huyền thoại", "Khuôn mẫu cho bài viết Sinh vật huyền thoại",
                new[] { "Tên gọi", "Tên khác", "Thần thoại gốc", "Phân loại", "Môi trường", "Năng lực", "Ý nghĩa biểu tượng", "Trạng thái" },
                new[] { "Mô Tả", "Ngoại Hình", "Truyền Thuyết", "Năng Lực", "Dị Bản", "Ảnh Hưởng Văn Hóa" }),
            new("Thực thể siêu nhiên", "Khuôn mẫu cho bài viết Thực thể siêu nhiên",
                new[] { "Tên gọi", "Hiệu", "Phân loại", "Thần thoại gốc", "Nơi cư ngụ", "Quyền năng", "Trạng thái" },
                new[] { "Mô Tả", "Ngoại Hình", "Quyền Năng", "Nguồn Gốc", "Lãnh Địa", "Phàm Trần" }),
            new("Bệnh tật/Nguyền rủa", "Khuôn mẫu cho bài viết Bệnh tật/Nguyền rủa",
                new[] { "Tên gọi", "Loại", "Nguồn gốc", "Triệu chứng", "Cách lây/lan truyền", "Mức độ nguy hiểm", "Cách chữa/giải", "Trạng thái" },
                new[] { "Mô Tả", "Triệu Chứng", "Nguyên Nhân", "Cách Chữa Trị", "Lịch Sử", "Trường Hợp Nổi Bật" }),

            // 5. Văn hóa & Tín ngưỡng
            new("Tôn giáo", "Khuôn mẫu cho bài viết Tôn giáo",
                new[] { "Tên tôn giáo", "Thờ phụng", "Sáng lập", "Trung tâm", "Tín đồ", "Khu vực", "Giáo phái", "Trạng thái" },
                new[] { "Mô Tả", "Giáo Lý", "Thần Linh", "Nghi Lễ", "Giáo Hội", "Lịch Sử" }),
            new("Truyền thống", "Khuôn mẫu cho bài viết Truyền thống",
                new[] { "Tên phong tục", "Loại", "Khu vực", "Thời điểm", "Đối tượng", "Ý nghĩa", "Nguồn gốc" },
                new[] { "Mô Tả", "Lịch Sử", "Diễn Biến", "Ý Nghĩa", "Vật Dụng" }),
            new("Thần thoại/Truyền thuyết", "Khuôn mẫu cho bài viết Thần thoại/Truyền thuyết",
                new[] { "Tên tác phẩm", "Thể loại", "Nguồn gốc", "Thời đại", "Nhân vật liên quan", "Tôn giáo liên quan" },
                new[] { "Mô Tả", "Nội Dung", "Ý Nghĩa", "Nguồn Gốc", "Dị Bản" }),
            new("Ngôn ngữ", "Khuôn mẫu cho bài viết Ngôn ngữ",
                new[] { "Tên ngôn ngữ", "Ngữ hệ", "Khu vực sử dụng", "Người sử dụng", "Chữ viết", "Phương ngữ", "Trạng thái" },
                new[] { "Mô Tả", "Ngữ Pháp & Âm Vị", "Chữ Viết", "Từ Vựng Tiêu Biểu", "Lịch Sử", "Phân Bố" }),
            new("Văn bản/Tư liệu", "Khuôn mẫu cho bài viết Văn bản/Tư liệu",
                new[] { "Tên văn bản", "Loại", "Tác giả", "Niên đại", "Ngôn ngữ gốc", "Nơi lưu trữ", "Tình trạng", "Độ tin cậy" },
                new[] { "Mô Tả", "Nội Dung", "Nguồn Gốc", "Ảnh Hưởng", "Dị Bản/Bản Sao" }),
            new("Nghệ thuật", "Khuôn mẫu cho bài viết Nghệ thuật",
                new[] { "Tên tác phẩm", "Loại hình", "Tác giả", "Niên đại", "Xuất xứ", "Phong cách", "Nơi trưng bày", "Trạng thái" },
                new[] { "Mô Tả", "Nội Dung & Ý Nghĩa", "Phong Cách", "Lịch Sử", "Ảnh Hưởng" }),

            // 6. Vật phẩm & Kinh tế
            new("Vật phẩm", "Khuôn mẫu cho bài viết Vật phẩm/Chế tác",
                new[] { "Tên vật phẩm", "Loại", "Chất liệu", "Kích thước", "Xuất xứ", "Chủ sở hữu", "Hiệu ứng", "Độ hiếm" },
                new[] { "Mô Tả", "Ngoại Hình", "Công Dụng", "Lịch Sử", "Chủ Sở Hữu" }),
            new("Vật liệu", "Khuôn mẫu cho bài viết Vật liệu",
                new[] { "Tên vật liệu", "Loại", "Nguồn gốc", "Tính chất", "Độ hiếm", "Công dụng", "Nơi khai thác", "Trạng thái" },
                new[] { "Mô Tả", "Tính Chất", "Khai Thác & Chế Biến", "Công Dụng", "Giá Trị Kinh Tế" }),
            new("Phát minh", "Khuôn mẫu cho bài viết Phát minh",
                new[] { "Tên phát minh", "Loại", "Người phát minh", "Thời gian", "Nguyên lý hoạt động", "Mức độ phổ biến", "Tác động", "Trạng thái" },
                new[] { "Mô Tả", "Nguyên Lý Hoạt Động", "Quá Trình Phát Triển", "Ứng Dụng", "Tác Động Xã Hội" }),
            new("Dược phẩm/Thuốc", "Khuôn mẫu cho bài viết Dược phẩm/Thuốc",
                new[] { "Tên dược phẩm", "Loại", "Thành phần", "Công dụng", "Tác dụng phụ", "Liều dùng", "Độ hiếm", "Trạng thái" },
                new[] { "Mô Tả", "Thành Phần & Bào Chế", "Công Dụng", "Tác Dụng Phụ & Rủi Ro", "Lịch Sử" }),
            new("Tiền tệ", "Khuôn mẫu cho bài viết Tiền tệ",
                new[] { "Tên tiền tệ", "Loại", "Quốc gia phát hành", "Đơn vị", "Chất liệu", "Tỷ giá", "Phạm vi lưu hành", "Trạng thái" },
                new[] { "Mô Tả", "Đặc Điểm", "Lịch Sử", "Giá Trị & Tỷ Giá", "Phạm Vi Sử Dụng" }),

            // 7. Lý thuyết & Quy luật vũ trụ
            new("Quy luật tự nhiên", "Khuôn mẫu cho bài viết Quy luật tự nhiên",
                new[] { "Tên quy luật", "Loại", "Phạm vi áp dụng", "Người khám phá", "Ngoại lệ", "Trạng thái" },
                new[] { "Mô Tả", "Nguyên Lý", "Ứng Dụng", "Ngoại Lệ & Phá Vỡ", "Lịch Sử Khám Phá" }),
            new("Ngành khoa học/Công nghệ", "Khuôn mẫu cho bài viết Ngành khoa học/Công nghệ",
                new[] { "Tên ngành", "Loại", "Nền tảng lý thuyết", "Khu vực phát triển", "Trình độ phát triển", "Ứng dụng", "Trạng thái" },
                new[] { "Mô Tả", "Nguyên Lý Cơ Bản", "Ứng Dụng", "Trình Độ Phát Triển", "Lịch Sử" }),
            new("Nguồn năng lượng/Tài nguyên", "Khuôn mẫu cho bài viết Nguồn năng lượng/Tài nguyên",
                new[] { "Tên nguồn", "Loại", "Nguồn gốc", "Khu vực phân bố", "Độ hiếm", "Cách khai thác", "Công dụng", "Trạng thái" },
                new[] { "Mô Tả", "Đặc Tính", "Khai Thác", "Công Dụng", "Giá Trị Kinh Tế/Chiến Lược" }),
        };

        foreach (var t in templates)
        {
            context.ArticleTemplates.Add(new ArticleTemplate
            {
                Title = t.Title,
                Description = t.Description,
                Content = BuildContentJson(t.Fields, t.MucLuc)
            });
        }

        context.SaveChanges();
    }

    // ----- Helpers tạo Tiptap JSON content (tương đương bản JS) -----

    private record TemplateDef(string Title, string Description, string[] Fields, string[] MucLuc);

    private static string BuildContentJson(string[] fields, string[] mucLuc)
    {
        var content = new List<object>
        {
            new
            {
                type = "customInfoBox",
                attrs = new
                {
                    title = "Tổng quan",
                    metadata = fields.Select(f => new { key = TextDoc(f), value = TextDoc("") }).ToList()
                }
            }
        };

        foreach (var item in mucLuc)
        {
            content.Add(new
            {
                type = "heading",
                attrs = new { level = 2 },
                content = new[] { new { type = "text", text = item } }
            });
            content.Add(new { type = "paragraph" });
        }

        var doc = new { type = "doc", content };
        return JsonSerializer.Serialize(doc);
    }

    private static object TextDoc(string text)
    {
        return new
        {
            type = "doc",
            content = new[]
            {
                new
                {
                    type = "paragraph",
                    content = string.IsNullOrEmpty(text)
                        ? Array.Empty<object>()
                        : new object[] { new { type = "text", text } }
                }
            }
        };
    }
}