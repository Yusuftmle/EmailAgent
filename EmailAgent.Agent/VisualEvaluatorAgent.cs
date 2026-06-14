using System;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Agent.Core;
using EmailAgent.Core.Entities;
using Microsoft.Extensions.Logging;

namespace EmailAgent.Agent;

public class VisualEvaluatorAgent
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
    private readonly ILogger<VisualEvaluatorAgent> _logger;

    public VisualEvaluatorAgent(IServiceProvider serviceProvider, Microsoft.Extensions.Configuration.IConfiguration config, ILogger<VisualEvaluatorAgent> logger)
    {
        _serviceProvider = serviceProvider;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Analyzes a product image based on the category using a Provider-Agnostic Vision Model
    /// </summary>
    public async Task<string> EvaluateImageAsync(UserPreferences userPrefs, string imageUrl, string categoryName, string requiredFeatures)
    {
        if (string.IsNullOrWhiteSpace(imageUrl)) return "No image provided.";

        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        // Factory Pattern: Spin up the Vision sub-agent based on user's API key
        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, provider == "Gemini" ? "gemini-flash-latest" : "gpt-4o", apiKey)
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        // Dynamic Persona / Contextual Prompting
        string personaPrompt = categoryName.ToLowerInvariant() switch
        {
            var name when name.Contains("oto") || name.Contains("araç") || name.Contains("car") =>
                "Sen kıdemli bir oto ekspertiz uzmanısın. Resme bakarak güneş yanığı, çizik, boya solması, değişen parça ihtimali veya kasanın makyajlı (facelift) olup olmadığını detaylı analiz et.",
            var name when name.Contains("laptop") || name.Contains("bilgisayar") || name.Contains("pc") =>
                "Sen kıdemli bir donanım uzmanısın. Resimdeki cihazın kozmetik durumunu, klavye/ekran deformasyonlarını veya model yılı farklılıklarını analiz et.",
            var name when name.Contains("giyim") || name.Contains("elbise") || name.Contains("moda") =>
                "Sen profesyonel bir moda danışmanısın. Resimdeki kıyafetin kalıbını, rengini, trendlere uygunluğunu ve kombinlenebilirliğini analiz et.",
            _ => $"Sen bir '{categoryName}' uzmanısın. Ürünün resmini inceleyerek kozmetik, estetik ve kalite açısından değerlendir."
        };

        string systemPrompt = $@"{personaPrompt}
Müşteri aşağıdaki gereksinimleri (Required Features) arıyor:
'{requiredFeatures}'

Bu fotoğrafı incele ve bu ürünün fiziksel/estetik olarak iyi durumda olup olmadığını, gereksinimleri karşılayıp karşılamadığını ve fiyatını hak eden bir görünüme sahip olup olmadığını 2-3 cümleyle net bir şekilde raporla. 
Kusurlu (defective) bulursan net bir dille 'REDDEDİLDİ: [Neden]' şeklinde başla.";

        chatHistory.AddSystemMessage(systemPrompt);

        // For actual Vision, we need to pass the image URL as an ImageContent. 
        // Semantic Kernel supports this via ImageContent item in ChatMessageContentItemCollection.
        var messageItems = new ChatMessageContentItemCollection
        {
            new TextContent("Lütfen bu ürün resmini analiz et."),
            new ImageContent(new Uri(imageUrl))
        };
        
        chatHistory.AddUserMessage(messageItems);

        try
        {
            _logger.LogInformation("VisualEvaluatorAgent ({Provider}): {Category} için görsel analiz başlatılıyor. Resim: {Url}", provider, categoryName, imageUrl);
            
            var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
            var content = response.Content?.Trim() ?? "Analiz yapılamadı.";

            _logger.LogInformation("VisualEvaluatorAgent ({Provider}): Analiz tamamlandı. Sonuç: {Result}", provider, content);
            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to evaluate image via VisualEvaluatorAgent.");
            return "Görsel analiz sırasında bir hata oluştu.";
        }
    }

    /// <summary>
    /// Katman 4: Görsel Derin Analiz (Visual Evaluator)
    /// Performs Comparative Analysis on the top N finalists to select the absolute best one.
    /// Incorporates the Watermark / Catalog Edge Case filter.
    /// </summary>
    public async Task<string> EvaluateTopDealsAsync(UserPreferences userPrefs, System.Collections.Generic.List<CategoryDeal> topDeals, string categoryName, string requiredFeatures)
    {
        if (topDeals == null || topDeals.Count == 0) return "Değerlendirilecek fırsat bulunamadı.";

        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, provider == "Gemini" ? "gemini-flash-latest" : "gpt-4o", apiKey)
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        string personaPrompt = categoryName.ToLowerInvariant() switch
        {
            var name when name.Contains("oto") || name.Contains("araç") || name.Contains("car") =>
                "Sen kıdemli bir oto ekspertiz uzmanısın. Resme bakarak güneş yanığı, çizik, boya solması, değişen parça ihtimali veya kasanın makyajlı (facelift) olup olmadığını detaylı analiz et.",
            var name when name.Contains("laptop") || name.Contains("bilgisayar") || name.Contains("pc") =>
                "Sen kıdemli bir donanım uzmanısın. Resimdeki cihazın kozmetik durumunu, klavye/ekran deformasyonlarını veya model yılı farklılıklarını analiz et.",
            var name when name.Contains("giyim") || name.Contains("elbise") || name.Contains("moda") =>
                "Sen profesyonel bir moda danışmanısın. Resimdeki kıyafetin kalıbını, rengini, trendlere uygunluğunu ve kombinlenebilirliğini analiz et.",
            _ => $"Sen bir '{categoryName}' uzmanısın. Ürün resimlerini inceleyerek kozmetik, estetik ve kalite açısından değerlendir."
        };

        string systemPrompt = $@"{personaPrompt}
Müşteri aşağıdaki gereksinimleri (Required Features) arıyor: '{requiredFeatures}'

Aşağıda fırsat (anomali) olarak yakalanmış finalist ilanların görselleri sana sırasıyla verilecek.
Görevlerin:
1. Görselleri birbiriyle kıyasla. Hangisinin fiziksel kondisyonu daha iyi?
2. EDGE-CASE KURALI: Eğer incelediğin görsellerden herhangi birinde yoğun bir galeri logosu (watermark), bayi yazısı veya gerçek dışı bir 'katalog / stock fotoğrafı' dokusu varsa, o ürünü doğrudan 'Güvenilir Değil' olarak işaretle ve ele.
3. Bana bu finalistler arasından görsel ve estetik olarak EN İYİ (Best) olanını seç ve nedenini 2-3 cümleyle raporla.";

        chatHistory.AddSystemMessage(systemPrompt);

        var messageItems = new ChatMessageContentItemCollection();
        messageItems.Add(new TextContent("İşte sana en iyi fırsatların resimleri (Sırasıyla İlan 1, İlan 2...):"));

        int counter = 1;
        foreach (var deal in topDeals)
        {
            if (!string.IsNullOrWhiteSpace(deal.ImageUrl))
            {
                messageItems.Add(new TextContent($"İlan {counter}: {deal.Title} - Fiyat: {deal.CurrentPrice}"));
                messageItems.Add(new ImageContent(new Uri(deal.ImageUrl)));
            }
            counter++;
        }

        chatHistory.AddUserMessage(messageItems);

        try
        {
            _logger.LogInformation("VisualEvaluatorAgent ({Provider}): {Count} adet finalist {Category} için karşılaştırmalı analiz başlatılıyor.", provider, topDeals.Count, categoryName);
            
            var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
            var content = response.Content?.Trim() ?? "Analiz yapılamadı.";

            _logger.LogInformation("VisualEvaluatorAgent ({Provider}): Karşılaştırmalı Analiz tamamlandı. Sonuç: {Result}", provider, content);
            return content;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to evaluate top deals via VisualEvaluatorAgent.");
            return "Karşılaştırmalı görsel analiz sırasında bir hata oluştu.";
        }
    }
}
