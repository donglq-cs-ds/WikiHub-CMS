using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.RegularExpressions;

namespace WikiHub.Api.Controllers // đổi lại namespace cho khớp project của ông
{
    [ApiController]
    [Route("api/[controller]")]
    public class LinkPreviewController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IMemoryCache _cache;

        public LinkPreviewController(IHttpClientFactory httpClientFactory, IMemoryCache cache)
        {
            _httpClientFactory = httpClientFactory;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetPreview([FromQuery] string url)
        {
            if (string.IsNullOrWhiteSpace(url) || !Uri.TryCreate(url, UriKind.Absolute, out var uri))
                return BadRequest("URL không hợp lệ.");

            if (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
                return BadRequest("Chỉ hỗ trợ http/https.");

            // Chặn SSRF: không cho gọi vào địa chỉ nội bộ / mạng riêng
            if (IsPrivateOrLocalHost(uri.Host))
                return BadRequest("Không được phép truy cập địa chỉ nội bộ.");

            var cacheKey = $"linkpreview:{uri}";
            if (_cache.TryGetValue(cacheKey, out object? cached))
                return Ok(cached);

            try
            {
                var client = _httpClientFactory.CreateClient("LinkPreview");
                client.Timeout = TimeSpan.FromSeconds(5);
                client.DefaultRequestHeaders.UserAgent.ParseAdd("Mozilla/5.0 (compatible; WikiHubBot/1.0)");

                using var response = await client.GetAsync(uri);
                if (!response.IsSuccessStatusCode)
                    return NotFound("Không thể tải trang.");

                var contentType = response.Content.Headers.ContentType?.MediaType ?? "";
                if (!contentType.Contains("text/html"))
                    return BadRequest("URL không trả về nội dung HTML.");

                // Chỉ đọc 1 đoạn đầu trang (đủ chứa <head>), tránh tải nguyên trang nặng
                await using var stream = await response.Content.ReadAsStreamAsync();
                using var reader = new StreamReader(stream);
                var buffer = new char[300_000];
                var read = await reader.ReadBlockAsync(buffer, 0, buffer.Length);
                var html = new string(buffer, 0, read);

                var result = new
                {
                    url = uri.ToString(),
                    title = ExtractMeta(html, "og:title") ?? ExtractTitle(html),
                    description = ExtractMeta(html, "og:description") ?? ExtractMetaName(html, "description"),
                    image = ResolveUrl(ExtractMeta(html, "og:image"), uri),
                    siteName = ExtractMeta(html, "og:site_name") ?? uri.Host
                };

                _cache.Set(cacheKey, result, TimeSpan.FromHours(12));
                return Ok(result);
            }
            catch (TaskCanceledException)
            {
                return StatusCode(504, "Trang đích phản hồi quá lâu.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Lỗi khi lấy preview: {ex.Message}");
            }
        }

        private static string? ExtractMeta(string html, string property)
        {
            var pattern = $@"<meta[^>]*property=[""']{Regex.Escape(property)}[""'][^>]*content=[""']([^""']*)[""'][^>]*>";
            var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
            if (!match.Success)
            {
                pattern = $@"<meta[^>]*content=[""']([^""']*)[""'][^>]*property=[""']{Regex.Escape(property)}[""'][^>]*>";
                match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
            }
            return match.Success ? WebUtility.HtmlDecode(match.Groups[1].Value) : null;
        }

        private static string? ExtractMetaName(string html, string name)
        {
            var pattern = $@"<meta[^>]*name=[""']{Regex.Escape(name)}[""'][^>]*content=[""']([^""']*)[""'][^>]*>";
            var match = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
            return match.Success ? WebUtility.HtmlDecode(match.Groups[1].Value) : null;
        }

        private static string? ExtractTitle(string html)
        {
            var match = Regex.Match(html, @"<title[^>]*>([^<]*)</title>", RegexOptions.IgnoreCase);
            return match.Success ? WebUtility.HtmlDecode(match.Groups[1].Value.Trim()) : null;
        }

        private static string? ResolveUrl(string? maybeRelative, Uri baseUri)
        {
            if (string.IsNullOrWhiteSpace(maybeRelative)) return null;
            if (Uri.TryCreate(maybeRelative, UriKind.Absolute, out var abs)) return abs.ToString();
            if (Uri.TryCreate(baseUri, maybeRelative, out var resolved)) return resolved.ToString();
            return null;
        }

        private static bool IsPrivateOrLocalHost(string host)
        {
            if (host.Equals("localhost", StringComparison.OrdinalIgnoreCase)) return true;
            if (IPAddress.TryParse(host, out var ip))
            {
                if (IPAddress.IsLoopback(ip)) return true;
                var b = ip.GetAddressBytes();
                if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
                {
                    if (b[0] == 10) return true;                          // 10.0.0.0/8
                    if (b[0] == 172 && b[1] >= 16 && b[1] <= 31) return true; // 172.16.0.0/12
                    if (b[0] == 192 && b[1] == 168) return true;          // 192.168.0.0/16
                    if (b[0] == 169 && b[1] == 254) return true;          // link-local / cloud metadata IP
                }
            }
            return false;
        }
    }
}