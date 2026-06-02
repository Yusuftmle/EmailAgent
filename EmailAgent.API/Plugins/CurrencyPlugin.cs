using System;
using System.ComponentModel;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;

namespace EmailAgent.API.Plugins;

public class CurrencyPlugin
{
    private static readonly HttpClient _httpClient = new HttpClient();

    [KernelFunction("get_exchange_rate")]
    [Description("Gets the latest real-time exchange rate between two currencies (e.g., USD to TRY, EUR to USD).")]
    public async Task<string> GetExchangeRateAsync(
        [Description("The base currency code (e.g., USD, EUR)")] string fromCurrency,
        [Description("The target currency code (e.g., TRY, GBP)")] string toCurrency)
    {
        try
        {
            var url = $"https://api.frankfurter.app/latest?from={fromCurrency.ToUpper()}&to={toCurrency.ToUpper()}";
            var response = await _httpClient.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                return $"Error: Unable to fetch exchange rates. The API responded with {response.StatusCode}.";
            }

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var rates = doc.RootElement.GetProperty("rates");
            
            if (rates.TryGetProperty(toCurrency.ToUpper(), out var rateElement))
            {
                var rate = rateElement.GetDouble();
                return $"The current exchange rate is 1 {fromCurrency.ToUpper()} = {rate} {toCurrency.ToUpper()}";
            }

            return $"Error: Target currency {toCurrency} not found in the response.";
        }
        catch (Exception ex)
        {
            return $"Failed to fetch currency data: {ex.Message}";
        }
    }
}
