using System;
using System.Net.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Agent.Connectors;

namespace EmailAgent.Agent.Core;

/// <summary>
/// Aegis Core: Centralized Fluent Builder for Semantic Kernel.
/// Encapsulates Model Selection, Plugins, Hooks, and Memory provisioning.
/// </summary>
public class AegisKernelBuilder
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IKernelBuilder _builder;

    public AegisKernelBuilder(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
        _builder = Kernel.CreateBuilder();
        _builder.Services.AddSingleton(serviceProvider);
    }

    /// <summary>
    /// Binds the specified LLM Model to the Kernel agnostically.
    /// </summary>
    public AegisKernelBuilder UseModel(string provider, string modelId, string apiKey, HttpClient? customClient = null)
    {
        if (provider == "Gemini")
        {
            // Note: In newer Semantic Kernel versions, Gemini requires Microsoft.SemanticKernel.Connectors.Google
            // Assuming it's already added in the project
            _builder.AddGoogleAIGeminiChatCompletion(modelId: modelId, apiKey: apiKey);
        }
        else if (provider == "Groq")
        {
            _builder.AddOpenAIChatCompletion(
                modelId: modelId,
                apiKey: apiKey,
                httpClient: customClient ?? new HttpClient { BaseAddress = new Uri("https://api.groq.com/openai/v1/") });
        }
        else
        {
            var chatCompletion = new ClaudeChatCompletionService(modelId, apiKey, customClient, _serviceProvider);
            _builder.Services.AddKeyedSingleton<IChatCompletionService>(null, chatCompletion);
        }
        return this;
    }

    /// <summary>
    /// Registers a standard object as an AI Plugin (Tool).
    /// </summary>
    public AegisKernelBuilder WithPlugin(object pluginInstance, string pluginName)
    {
        _builder.Plugins.AddFromObject(pluginInstance, pluginName);
        return this;
    }

    /// <summary>
    /// Adds architectural observability and human-in-the-loop security hooks.
    /// </summary>
    public AegisKernelBuilder WithSecurityHooks()
    {
        // Future: Register Pre/Post Execution Hooks for Telegram Approval or Data Masking
        // e.g. _builder.Services.AddSingleton<IFunctionInvocationFilter, SecurityFilter>();
        return this;
    }

    /// <summary>
    /// Connects Semantic Text Memory (Vector Database) for deep RAG.
    /// </summary>
    public AegisKernelBuilder WithSemanticMemory()
    {
        // Future: Connect Qdrant, ChromaDB, or SQLite Vector Store
        // e.g. _builder.AddMemoryConnector(new QdrantMemoryStore());
        return this;
    }

    /// <summary>
    /// Finalizes and builds the Kernel instance.
    /// </summary>
    public Kernel Build()
    {
        return _builder.Build();
    }
}
