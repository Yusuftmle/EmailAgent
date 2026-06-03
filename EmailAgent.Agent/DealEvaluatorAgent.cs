using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Agent.Core;
using EmailAgent.Core.Entities;

namespace EmailAgent.Agent;

public class DealEvaluatorAgent
{
    private readonly IServiceProvider _serviceProvider;
    private readonly HttpClient _httpClient;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

    public DealEvaluatorAgent(IServiceProvider serviceProvider, IHttpClientFactory httpClientFactory, Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _serviceProvider = serviceProvider;
        _httpClient = httpClientFactory.CreateClient("AIAgentClient");
        _config = config;
    }

    public async Task<bool> EvaluateDealAsync(UserPreferences userPrefs, string productTitle, string requiredFeatures)
    {
        var provider = string.IsNullOrEmpty(userPrefs.AiProvider) ? "Gemini" : userPrefs.AiProvider;
        var apiKey = string.IsNullOrWhiteSpace(userPrefs.ApiKey) ? _config[$"{provider}:ApiKey"] : userPrefs.ApiKey;

        // Create an isolated sub-agent (kernel)
        var kernel = new AegisKernelBuilder(_serviceProvider)
            .UseModel(provider, "gemini-flash-latest", apiKey, _httpClient)
            .Build();

        var chatService = kernel.GetRequiredService<IChatCompletionService>();
        var chatHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();

        string systemPrompt = @"You are a strict shopping deal filter agent.
Your ONLY job is to decide if a given product title matches the user's specific feature requirements.
Often, accessories (like cases, chargers, screen protectors) are mixed in with actual devices. 
If the user wants a phone/device and the title is an accessory, you must reject it.
Respond with ONLY 'YES' or 'NO'. No other text.";

        chatHistory.AddSystemMessage(systemPrompt);

        string userPrompt = $"User's Required Features: {requiredFeatures}\n\nProduct Title Found: {productTitle}\n\nDoes this product title represent the MAIN product requested by the user, and does it meet the required features? (YES/NO)";
        
        chatHistory.AddUserMessage(userPrompt);

        try
        {
            var response = await chatService.GetChatMessageContentAsync(chatHistory, null, kernel);
            var content = response.Content?.Trim().ToUpper() ?? "";

            return content.Contains("YES");
        }
        catch (Exception)
        {
            // If the AI fails (e.g., rate limit), default to true so we don't miss deals, or false to avoid spam.
            // Let's default to false to avoid spamming the user if the AI is down.
            return false;
        }
    }
}
