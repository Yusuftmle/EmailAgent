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
            var retryHandler = new RetryDelegatingHandler(new HttpClientHandler());
            var geminiClient = new HttpClient(retryHandler);
            if (customClient != null)
            {
                geminiClient.Timeout = customClient.Timeout;
            }

            _builder.AddGoogleAIGeminiChatCompletion(
                modelId: modelId, 
                apiKey: apiKey, 
                httpClient: geminiClient,
                apiVersion: Microsoft.SemanticKernel.Connectors.Google.GoogleAIVersion.V1_Beta);
        }
        else if (provider == "Groq")
        {
            var groqHandler = new GroqEndpointHandler(new HttpClientHandler());
            var groqClient = new HttpClient(groqHandler);
            _builder.AddOpenAIChatCompletion(
                modelId: "llama-3.3-70b-versatile", // Hardcode the best Groq model for now
                apiKey: apiKey,
                httpClient: groqClient);
        }
        else
        {
            var chatCompletion = new ClaudeChatCompletionService(provider, modelId, apiKey, customClient, _serviceProvider);
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

public class GroqEndpointHandler : DelegatingHandler
{
    public GroqEndpointHandler(HttpMessageHandler innerHandler) : base(innerHandler)
    {
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
    {
        if (request.RequestUri != null && request.RequestUri.Host == "api.openai.com")
        {
            request.RequestUri = new Uri($"https://api.groq.com/openai{request.RequestUri.AbsolutePath}{request.RequestUri.Query}");
        }
        return base.SendAsync(request, cancellationToken);
    }
}

public class RetryDelegatingHandler : DelegatingHandler
{
    private readonly int _maxRetries = 5;

    public RetryDelegatingHandler(HttpMessageHandler innerHandler) : base(innerHandler)
    {
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, System.Threading.CancellationToken cancellationToken)
    {
        HttpResponseMessage? response = null;
        for (int i = 0; i <= _maxRetries; i++)
        {
            try
            {
                HttpRequestMessage req = request;
                if (i > 0)
                {
                    req = await CloneHttpRequestMessageAsync(request);
                }

                response = await base.SendAsync(req, cancellationToken);
                if (response.StatusCode == (System.Net.HttpStatusCode)429 && i < _maxRetries)
                {
                    var delay = TimeSpan.FromSeconds((i + 1) * 7); // 7s, 14s, 21s, 28s, 35s backoff to clear Gemini limits
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }
                return response;
            }
            catch (HttpRequestException ex) when (ex.StatusCode == (System.Net.HttpStatusCode)429 && i < _maxRetries)
            {
                var delay = TimeSpan.FromSeconds((i + 1) * 7);
                await Task.Delay(delay, cancellationToken);
            }
        }

        if (response != null)
        {
            return response;
        }

        return await base.SendAsync(request, cancellationToken);
    }

    private async Task<HttpRequestMessage> CloneHttpRequestMessageAsync(HttpRequestMessage req)
    {
        var clone = new HttpRequestMessage(req.Method, req.RequestUri);

        if (req.Content != null)
        {
            var contentBytes = await req.Content.ReadAsByteArrayAsync();
            clone.Content = new ByteArrayContent(contentBytes);
            foreach (var h in req.Content.Headers)
            {
                clone.Content.Headers.TryAddWithoutValidation(h.Key, h.Value);
            }
        }

        clone.Version = req.Version;

        foreach (var prop in req.Options)
        {
            clone.Options.Set(new HttpRequestOptionsKey<object?>(prop.Key), prop.Value);
        }

        foreach (var h in req.Headers)
        {
            clone.Headers.TryAddWithoutValidation(h.Key, h.Value);
        }

        return clone;
    }
}
