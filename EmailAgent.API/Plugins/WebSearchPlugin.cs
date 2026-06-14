using System;
using System.ComponentModel;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using System.Text.RegularExpressions;
using System.Net;
using System.Collections.Generic;

namespace EmailAgent.API.Plugins;

public class WebSearchPlugin
{
    private readonly HttpClient _httpClient;
    private readonly string _serperApiKey = "416db12e9bf14c637595056af29a774fe9945275";

    public WebSearchPlugin(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [KernelFunction("SearchWebAsync")]
    [Description("Searches the internet to find exact product links, category pages, or prices (e.g. MediaMarkt, Vatan Bilgisayar, Amazon Europe). Use this FIRST to find the URL of a category if the user asks you to track a category but only provides the store name.")]
    public async Task<string> SearchWebAsync(
        [Description("The search query. For finding category links, use '{Store Name} {Product Name}' e.g., 'Vatan Bilgisayar iPhone 13 Pro'")] string query)
    {
        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "https://google.serper.dev/search");
            request.Headers.Add("X-API-KEY", _serperApiKey);
            var payload = System.Text.Json.JsonSerializer.Serialize(new { q = query });
            request.Content = new StringContent(payload, System.Text.Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                return $"Arama API'si başarısız oldu: {response.StatusCode}";
            }

            var json = await response.Content.ReadAsStringAsync();
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            
            if (!doc.RootElement.TryGetProperty("organic", out var organicResults))
            {
                return "İnternette arama yapıldı ancak organik sonuç bulunamadı.";
            }

            var results = new List<string>();
            int limit = Math.Min(5, organicResults.GetArrayLength());
            
            for (int i = 0; i < limit; i++)
            {
                var result = organicResults[i];
                var title = result.TryGetProperty("title", out var t) ? t.GetString() : "No Title";
                var link = result.TryGetProperty("link", out var l) ? l.GetString() : "No Link";
                var snippet = result.TryGetProperty("snippet", out var s) ? s.GetString() : "No Snippet";
                
                results.Add($"Sonuç {i+1}:\nBaşlık: {title}\nLink: {link}\nÖzet: {snippet}\n");
            }

            return $"Arama Sorgusu: '{query}'\n\nBulunan Sonuçlar:\n" + string.Join("\n", results);
        }
        catch (Exception ex)
        {
            return $"Web araması sırasında bir hata oluştu: {ex.Message}";
        }
    }
}
