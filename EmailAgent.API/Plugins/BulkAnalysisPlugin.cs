using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.SemanticKernel;
using EmailAgent.Infrastructure.Data;
using EmailAgent.Core.Entities;

namespace EmailAgent.API.Plugins;

public class BulkAnalysisPlugin
{
    private readonly EmailAgentDbContext _dbContext;
    private readonly Guid _userId;

    public BulkAnalysisPlugin(EmailAgentDbContext dbContext, Guid userId)
    {
        _dbContext = dbContext;
        _userId = userId;
    }

    [KernelFunction("GetTrackedProductsSummary")]
    [Description("Returns a summary of all products the user is tracking, including their current prices and target prices. Use this when the user asks to compare their tracked products or asks which product is the best deal.")]
    public async Task<string> GetTrackedProductsSummaryAsync()
    {
        var products = await _dbContext.TrackedProducts
            .Where(p => p.UserId == _userId && p.IsActive)
            .ToListAsync();

        if (!products.Any())
            return "Kullanıcının aktif takip ettiği bir ürün bulunmuyor.";

        var lines = new List<string> { $"Toplam {products.Count} takip edilen ürün:\n" };
        foreach (var p in products)
        {
            var gap = p.TargetPrice > 0 ? $"Hedefe kalan: {Math.Round(p.LastKnownPrice - p.TargetPrice, 2)} {p.Currency}" : "Hedef belirlenmemiş";
            lines.Add($"- **{p.Title}**\n  Şu anki fiyat: {p.LastKnownPrice} {p.Currency} | Hedef: {p.TargetPrice} {p.Currency} | {gap}\n  Link: {p.Url}");
        }
        return string.Join("\n", lines);
    }
}
