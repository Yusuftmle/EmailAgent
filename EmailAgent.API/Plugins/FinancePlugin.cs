using System;
using System.ComponentModel;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;

namespace EmailAgent.API.Plugins;

public class FinancePlugin
{
    private readonly HttpClient _httpClient;

    public FinancePlugin(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [KernelFunction("GetCryptoPriceAndTrendAsync")]
    [Description("Fetches the real-time price, 24-hour change, and market status of a cryptocurrency using CoinGecko API. Use this when the user asks about Bitcoin (bitcoin), Ethereum (ethereum), or other cryptos.")]
    public async Task<string> GetCryptoPriceAndTrendAsync(
        [Description("The CoinGecko ID of the cryptocurrency (e.g. 'bitcoin', 'ethereum', 'solana', 'tether').")] string coinId)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(coinId)) coinId = "bitcoin";
            
            var url = $"https://api.coingecko.com/api/v3/simple/price?ids={coinId.ToLowerInvariant()}&vs_currencies=usd,try&include_24hr_change=true";
            
            var request = new HttpRequestMessage(HttpMethod.Get, url);
            // CoinGecko requires a User-Agent
            request.Headers.Add("User-Agent", "AegisAgent/1.0");

            var response = await _httpClient.SendAsync(request);
            
            if (!response.IsSuccessStatusCode)
            {
                return $"Error: Unable to fetch crypto data. Status Code: {response.StatusCode}";
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            
            if (!doc.RootElement.TryGetProperty(coinId.ToLowerInvariant(), out var coinData))
            {
                return $"Could not find cryptocurrency with ID: {coinId}. Make sure you are using the correct full name.";
            }

            var usdPrice = coinData.TryGetProperty("usd", out var u) ? u.GetDouble() : 0;
            var tryPrice = coinData.TryGetProperty("try", out var t) ? t.GetDouble() : 0;
            var change24h = coinData.TryGetProperty("usd_24h_change", out var c) ? c.GetDouble() : 0;

            string trend = change24h > 0 ? "Yükselişte (📈)" : "Düşüşte (📉)";

            return $"Coin: {coinId.ToUpper()}\n" +
                   $"Fiyat (USD): ${usdPrice:N2}\n" +
                   $"Fiyat (TRY): ₺{tryPrice:N2}\n" +
                   $"24 Saatlik Değişim: %{change24h:N2} {trend}";
        }
        catch (Exception ex)
        {
            return $"Error fetching crypto data: {ex.Message}";
        }
    }
}
