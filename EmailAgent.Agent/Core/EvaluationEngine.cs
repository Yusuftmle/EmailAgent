using System;
using System.Collections.Generic;
using System.Linq;
using EmailAgent.Core.Entities;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Agent.Core;

public class EvaluationEngine
{
    private readonly ILogger<EvaluationEngine> _logger;

    public EvaluationEngine(ILogger<EvaluationEngine> logger)
    {
        _logger = logger;
    }

    /// <summary>
    /// Katman 2: Hard-Filter & Matematiksel Anomali (Dynamic Threshold)
    /// Finds mathematically cheap deals by using Mean and Standard Deviation.
    /// Only returns deals that are at least 1.5 StdDev cheaper than the average.
    /// </summary>
    public List<CategoryDeal> EvaluateMathematicalAnomalies(List<CategoryDeal> deltaDeals)
    {
        if (deltaDeals == null || deltaDeals.Count < 5) return deltaDeals ?? new List<CategoryDeal>();

        var validPrices = deltaDeals.Where(d => d.CurrentPrice > 0).Select(d => (double)d.CurrentPrice).ToList();
        if (validPrices.Count < 5) return deltaDeals;

        double mean = validPrices.Average();
        double sumOfSquaresOfDifferences = validPrices.Select(val => (val - mean) * (val - mean)).Sum();
        double stdDev = Math.Sqrt(sumOfSquaresOfDifferences / validPrices.Count);

        double threshold = mean - (1.5 * stdDev);

        _logger.LogInformation("EvaluationEngine: Hard-Filter uygulandı. Ortalama: {Mean}, StdDev: {StdDev}, Eşik: {Threshold}", mean, stdDev, threshold);

        var anomalies = deltaDeals.Where(d => d.CurrentPrice > 0 && (double)d.CurrentPrice <= threshold).ToList();
        
        // Eğer aşırı katı olduysa ve hiç sonuç dönmediyse, en azından ortalamanın %20 altındakileri al
        if (anomalies.Count == 0)
        {
            anomalies = deltaDeals.Where(d => d.CurrentPrice > 0 && (double)d.CurrentPrice < (mean * 0.8)).ToList();
        }

        _logger.LogInformation("EvaluationEngine: {Total} ilandan {AnomalyCount} adet fırsat LINQ ile süzüldü.", deltaDeals.Count, anomalies.Count);
        return anomalies;
    }
}
