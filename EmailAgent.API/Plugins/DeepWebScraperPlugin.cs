using System;
using System.ComponentModel;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.SemanticKernel;
using HtmlAgilityPack;
using System.Text.RegularExpressions;
using System.Net;

namespace EmailAgent.API.Plugins;

public class DeepWebScraperPlugin
{
    private const int MaxContentLength = 10000;

    private readonly IEnumerable<EmailAgent.Core.Interfaces.ISiteStrategy> _strategies;

    public DeepWebScraperPlugin(IEnumerable<EmailAgent.Core.Interfaces.ISiteStrategy> strategies)
    {
        _strategies = strategies;
    }

    [KernelFunction("ScrapeWebPageAsync")]
    [Description("Reads the full text content of a specific web page URL. Use this to read the details, prices, or articles inside a webpage when a simple web search snippet is not enough.")]
    public async Task<string> ScrapeWebPageAsync(
        [Description("The absolute URL of the web page to scrape (e.g. https://www.amazon.de/...)")] string url)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(url) || !url.StartsWith("http"))
            {
                return "Hata: Geçersiz bir URL sağlandı.";
            }

            var strategy = _strategies.FirstOrDefault(s => s.CanHandle(url)) 
                        ?? _strategies.First(s => s.GetType().Name == "GenericStrategy");
            var html = await strategy.FetchHtmlAsync(url);

            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // Remove scripts, styles, and other non-content tags
            var nodesToRemove = doc.DocumentNode.SelectNodes("//script|//style|//link|//meta|//noscript|//iframe|//svg|//head");
            if (nodesToRemove != null)
            {
                foreach (var node in nodesToRemove)
                {
                    node.Remove();
                }
            }

            // Extract text from the body
            var body = doc.DocumentNode.SelectSingleNode("//body");
            if (body == null)
            {
                return "Sayfa içeriği (body) bulunamadı.";
            }

            var text = WebUtility.HtmlDecode(body.InnerText);

            // Clean up excessive whitespaces and newlines
            text = Regex.Replace(text, @"\s+", " ").Trim();

            // Truncate to save token limits
            if (text.Length > MaxContentLength)
            {
                text = text.Substring(0, MaxContentLength) + "\n... (Content truncated due to length limits) ...";
            }

            if (string.IsNullOrWhiteSpace(text))
            {
                return "Sayfadan okunabilir bir metin çıkarılamadı (belki de sayfa JavaScript ile render ediliyor).";
            }

            return $"--- Sayfa İçeriği Başlangıcı ({url}) ---\n{text}\n--- Sayfa İçeriği Sonu ---";
        }
        catch (HttpRequestException ex)
        {
            return $"Web sayfasına erişilemedi (HTTP Hatası): {ex.Message}";
        }
        catch (Exception ex)
        {
            return $"Sayfa okunurken bilinmeyen bir hata oluştu: {ex.Message}";
        }
    }
}
