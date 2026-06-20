namespace WikiHub.Api.Models.DTOs;

public class CreateTemplateDto
{
    public Guid WorldId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
}

public class UpdateTemplateDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string HtmlContent { get; set; } = string.Empty;
}