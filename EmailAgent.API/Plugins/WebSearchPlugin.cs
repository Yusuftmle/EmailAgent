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

    public WebSearchPlugin(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _httpClient.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    }

    [KernelFunction("SearchWebAsync")]
    [Description("Searches the internet for information, including product prices across Europe (e.g. MediaMarkt, Saturn, Amazon Europe, etc). Use this when the user asks to compare prices or find cheaper alternatives.")]
    public async Task<string> SearchWebAsync(
        [Description("The search query. To find European prices, append 'price germany' or 'MediaMarkt' etc. to the query.")] string query)
    {
        try
        {
            var searchUrl = $"https://html.duckduckgo.com/html/?q={Uri.EscapeDataString(query)}";
            var html = await _httpClient.GetStringAsync(searchUrl);

            // Extremely basic regex to extract DuckDuckGo snippets (result__snippet) and URLs (result__url)
            var snippetRegex = new Regex("<a class=\"result__snippet[^>]*>(.*?)</a>", RegexOptions.Singleline | RegexOptions.IgnoreCase);
            var matches = snippetRegex.Matches(html);

            if (matches.Count == 0)
                return "İnternette arama yapıldı ancak sonuç bulunamadı.";

            var results = new List<string>();
            int limit = Math.Min(5, matches.Count);
            for (int i = 0; i < limit; i++)
            {
                var cleanSnippet = WebUtility.HtmlDecode(Regex.Replace(matches[i].Groups[1].Value, "<.*?>", ""));
                results.Add($"- {cleanSnippet}");
            }

            return "İnternet Arama Sonuçları:\n" + string.Join("\n", results);
        }
        catch (Exception ex)
        {
            return $"Web araması sırasında bir hata oluştu: {ex.Message}";
        }
    }
}
