namespace EmailAgent.Core.Entities;

public class CategoryDeal
{
    public string Title { get; set; } = string.Empty;
    public string ProductUrl { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public decimal OriginalPrice { get; set; }
    public decimal CurrentPrice { get; set; }
    public decimal DiscountPercentage => OriginalPrice > 0 ? ((OriginalPrice - CurrentPrice) / OriginalPrice) * 100 : 0;
}
