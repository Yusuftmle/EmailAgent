using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Core.Entities;

namespace EmailAgent.Agent.Core;

public class AegisAgentOrchestrator
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<AegisAgentOrchestrator> _logger;
    private readonly Func<UserPreferences, System.Collections.Generic.IEnumerable<object>> _pluginFactory;

    public AegisAgentOrchestrator(
        IServiceProvider serviceProvider, 
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<AegisAgentOrchestrator> logger,
        Func<UserPreferences, System.Collections.Generic.IEnumerable<object>> pluginFactory)
    {
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
        _pluginFactory = pluginFactory;
    }

    public async Task<string> ExecuteAsync(Microsoft.SemanticKernel.ChatCompletion.ChatHistory history, UserPreferences user)
    {
        var client = _httpClientFactory.CreateClient("AIAgentClient");
        
        var activeProvider = user.AiProvider ?? "Claude";
        var activeKey = string.IsNullOrWhiteSpace(user.ApiKey) ? _config[$"{activeProvider}:ApiKey"] : user.ApiKey;

        if (string.IsNullOrWhiteSpace(activeKey))
        {
            return $"[Sistem Uyarısı] Lütfen ayarlar sayfasından {activeProvider} için geçerli bir API Anahtarı (API Key) girin. Sistemde varsayılan bir anahtar bulunamadı.";
        }

        // Pre-flight Validation
        if (activeProvider == "Gemini" && !activeKey.StartsWith("AIza") && !activeKey.StartsWith("AQ."))
        {
            return $"[Sistem Uyarısı] Girdiğiniz Gemini API anahtarı geçersiz görünüyor. Gemini anahtarları 'AIza' veya 'AQ.' ile başlamalıdır.";
        }
        if ((activeProvider == "OpenAI" || activeProvider == "Groq") && !activeKey.StartsWith("gsk_") && !activeKey.StartsWith("sk-"))
        {
            return $"[Sistem Uyarısı] Girdiğiniz {activeProvider} API anahtarı geçersiz görünüyor. Lütfen anahtarınızı kontrol edin.";
        }

        var activeModel = activeProvider switch
        {
            "Claude" => "claude-3-5-sonnet-20241022",
            "Gemini" => "gemini-flash-latest",
            "Groq" => "llama3-8b-8192",
            _ => "claude-3-5-sonnet-20241022"
        };

        var aegisBuilder = new AegisKernelBuilder(_serviceProvider)
            .UseModel(activeProvider, activeModel, activeKey, client)
            .WithSecurityHooks()
            .WithSemanticMemory();

        var plugins = _pluginFactory(user);
        foreach (var plugin in plugins)
        {
            aegisBuilder.WithPlugin(plugin, plugin.GetType().Name);
        }
            
        var kernel = aegisBuilder.Build();
        var chatCompletion = kernel.GetRequiredService<IChatCompletionService>();

        var executionSettings = new PromptExecutionSettings
        {
            FunctionChoiceBehavior = FunctionChoiceBehavior.Auto()
        };

        try
        {
            var lastUserMessage = System.Linq.Enumerable.LastOrDefault(history, h => h.Role == Microsoft.SemanticKernel.ChatCompletion.AuthorRole.User)?.Content;
            _logger.LogInformation("AI Yönlendirme Başladı. Sağlayıcı: {Provider}, Model: {Model}", activeProvider, activeModel);
            _logger.LogDebug("Kullanıcı Son Mesajı: {Message}", lastUserMessage);
            _logger.LogInformation("AI, gerekli Tool'ları (Plug-in) analiz ediyor ve plan yapıyor...");
            
            var responseContent = await chatCompletion.GetChatMessageContentAsync(history, executionSettings, kernel);
            
            _logger.LogInformation("AI Süreci Tamamlandı. Döndürülen İçerik Uzunluğu: {Length} karakter", responseContent.Content?.Length);
            _logger.LogDebug("AI Ham Yanıtı: {Response}", responseContent.Content);
            
            return responseContent.Content ?? "I couldn't process that request.";
        }
        catch (Microsoft.SemanticKernel.HttpOperationException ex)
        {
            _logger.LogError(ex, "Semantic Kernel HTTP Hatası: {Message}", ex.Message);
            return FormatHttpError(activeProvider, ex.StatusCode?.ToString(), ex.Message);
        }
        catch (HttpRequestException ex)
        {
            var statusCode = ex.StatusCode?.ToString() ?? (ex.Message.Contains("403") ? "403" : ex.Message.Contains("401") ? "401" : ex.Message.Contains("429") ? "429" : null);
            return FormatHttpError(activeProvider, statusCode, ex.Message);
        }
        catch (Exception ex)
        {
            return $"[Sistem Hatası] Beklenmeyen bir hata oluştu: {ex.Message}";
        }
    }

    private string FormatHttpError(string provider, string? statusCode, string rawMessage)
    {
        if (statusCode == "401" || statusCode == "403" || rawMessage.Contains("401") || rawMessage.Contains("403"))
        {
            return $"[Yetki Hatası] {provider} sunucusu API anahtarınızı reddetti (HTTP {statusCode}). Lütfen anahtarın doğruluğunu ve hesap limitlerinizi kontrol edin.";
        }
        if (statusCode == "429" || rawMessage.Contains("429") || rawMessage.Contains("Too Many Requests"))
        {
            return $"[Limit Hatası] {provider} için istek limitine ulaştınız. Lütfen biraz bekleyip tekrar deneyin veya hesabınıza bakiye yükleyin.";
        }
        return $"[Bağlantı Hatası] Yapay Zeka Motoru ({provider}) ile iletişim kurulamadı. Detay: {rawMessage}";
    }

    /// <summary>
    /// Masterclass Boru Hattı (Pipeline): Scrape -> Delta Check -> Math Filter -> Vision Filter -> Notification
    /// </summary>
    public async Task<string> ExecutePipelineAsync(
        UserPreferences userPrefs, 
        Guid categoryId, 
        string categoryName,
        string url, 
        string minifiedHtml, 
        string requiredFeatures)
    {
        try
        {
            _logger.LogInformation("AegisAgentOrchestrator: Pipeline başlatılıyor. Kategori: {Category}", categoryName);

            // 1. Scrape & Delta Check (SeenListings)
            var scraperAgent = _serviceProvider.GetRequiredService<UniversalScraperAgent>();
            var deltaDeals = await scraperAgent.ExtractAndDeltaCheckAsync(userPrefs, minifiedHtml, url, categoryId);

            if (deltaDeals == null || deltaDeals.Count == 0)
            {
                return "Yeni veya fiyatı düşen bir fırsat bulunamadı.";
            }

            // 2. Math Filter (EvaluationEngine)
            var evalEngine = _serviceProvider.GetRequiredService<EvaluationEngine>();
            var finalists = evalEngine.EvaluateMathematicalAnomalies(deltaDeals);

            if (finalists == null || finalists.Count == 0)
            {
                return "Matematiksel filtreyi (Hard-Filter) geçen bir fırsat bulunamadı.";
            }

            // 3. Vision Filter & Watermark Guard
            var visionAgent = _serviceProvider.GetRequiredService<VisualEvaluatorAgent>();
            var bestDealReport = await visionAgent.EvaluateTopDealsAsync(userPrefs, finalists, categoryName, requiredFeatures);

            _logger.LogInformation("AegisAgentOrchestrator: Pipeline başarıyla tamamlandı.");
            return bestDealReport;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Pipeline çalıştırılırken kritik bir hata oluştu.");
            return "Sistem hatası: Pipeline çalıştırılamadı.";
        }
    }
}
