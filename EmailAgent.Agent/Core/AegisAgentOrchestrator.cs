using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Core.Entities;

namespace EmailAgent.Agent.Core;

public class AegisAgentOrchestrator
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly Func<UserPreferences, System.Collections.Generic.IEnumerable<object>> _pluginFactory;

    public AegisAgentOrchestrator(
        IServiceProvider serviceProvider, 
        IHttpClientFactory httpClientFactory,
        Func<UserPreferences, System.Collections.Generic.IEnumerable<object>> pluginFactory)
    {
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
        _pluginFactory = pluginFactory;
    }

    public async Task<string> ExecuteAsync(Microsoft.SemanticKernel.ChatCompletion.ChatHistory history, UserPreferences user)
    {
        var client = _httpClientFactory.CreateClient("AIAgentClient");
        
        var activeProvider = user.AiProvider ?? "Claude";
        var activeKey = user.ApiKey ?? string.Empty;
        var activeModel = activeProvider switch
        {
            "Claude" => "claude-3-5-sonnet-20241022",
            "Gemini" => "gemini-flash-latest",
            "Groq" => "llama3-8b-8192",
            _ => "claude-3-5-sonnet-20241022"
        };

        var aegisBuilder = new AegisKernelBuilder(_serviceProvider)
            .UseModel(activeProvider, activeModel, activeKey, client)
            // Plugins must be retrieved from service provider inside the orchestrator now
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

        if (string.IsNullOrWhiteSpace(activeKey))
        {
            return $"Lütfen ayarlar sayfasından {activeProvider} için geçerli bir API Anahtarı (API Key) girin.";
        }

        try
        {
            var responseContent = await chatCompletion.GetChatMessageContentAsync(history, executionSettings, kernel);
            return responseContent.Content ?? "I couldn't process that request.";
        }
        catch (Microsoft.SemanticKernel.HttpOperationException ex)
        {
            return $"Yapay Zeka Motoru ({activeProvider}) ile bağlantı kurulamadı. API anahtarınızın (API Key) doğruluğunu kontrol edin. Hata Detayı: {ex.Message}";
        }
        catch (Exception ex)
        {
            return $"Beklenmeyen bir hata oluştu: {ex.Message}";
        }
    }
}
