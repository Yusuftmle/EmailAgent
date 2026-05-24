using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using EmailAgent.Core.Entities;
using EmailAgent.Core.Repositories;

namespace EmailAgent.Agent.Chat;

public interface IChatService
{
    Task<string> SendMessageAsync(string sessionId, string userMessage);
    Task<IEnumerable<EmailAgent.Core.Entities.ChatHistory>> GetHistoryAsync(string sessionId);
    Task ClearHistoryAsync(string sessionId);
}

public class ChatService : IChatService
{
    private readonly Kernel _kernel;
    private readonly IChatCompletionService _chatCompletionService;
    private readonly IChatHistoryRepository _chatHistoryRepo;
    private readonly IEmailAnalysisRepository _emailRepo;
    private readonly IUserPreferencesRepository _prefRepo;
    private readonly ILogger<ChatService> _logger;

    public ChatService(
        Kernel kernel,
        IChatHistoryRepository chatHistoryRepo,
        IEmailAnalysisRepository emailRepo,
        IUserPreferencesRepository prefRepo,
        ILogger<ChatService> logger)
    {
        _kernel = kernel;
        _chatCompletionService = kernel.GetRequiredService<IChatCompletionService>();
        _chatHistoryRepo = chatHistoryRepo;
        _emailRepo = emailRepo;
        _prefRepo = prefRepo;
        _logger = logger;
    }

    public async Task<string> SendMessageAsync(string sessionId, string userMessage)
    {
        try
        {
            _logger.LogInformation("Processing chat message for session: {SessionId}", sessionId);

            // 1. Fetch DB context data for RAG (Retrieval-Augmented Generation)
            var today = DateTime.UtcNow;
            var todayEmails = await _emailRepo.GetDailySummaryAsync(today);
            var preferences = await _prefRepo.GetAsync();

            // Fallback: If no emails today, load recent emails to provide context
            if (!todayEmails.Any())
            {
                todayEmails = await _emailRepo.GetAllAsync();
                // Take top 10 most recent
                todayEmails = todayEmails.Take(10);
            }

            // 2. Build standard System Prompt with Email and Preference Context
            var contextBuilder = new StringBuilder();
            contextBuilder.AppendLine("You are 'Claude Email Assistant', an intelligent, conversational agent designed to help the user manage, inspect, and reply to their emails.");
            contextBuilder.AppendLine($"Current UTC Time: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}");
            contextBuilder.AppendLine();
            
            if (preferences != null)
            {
                contextBuilder.AppendLine("=== USER FOCUS PREFERENCES ===");
                contextBuilder.AppendLine($"- Focus Companies: {string.Join(", ", preferences.FocusCompanies)}");
                contextBuilder.AppendLine($"- Key Keywords: {string.Join(", ", preferences.Keywords)}");
                contextBuilder.AppendLine();
            }

            contextBuilder.AppendLine("=== EMAIL RECORDS IN SYSTEM ===");
            var emailList = todayEmails.ToList();
            if (emailList.Count == 0)
            {
                contextBuilder.AppendLine("No emails have been processed today yet.");
            }
            else
            {
                foreach (var email in emailList)
                {
                    contextBuilder.AppendLine($"[ID: {email.Id}] From: {email.From} | Subject: {email.Subject}");
                    contextBuilder.AppendLine($"   - Importance: {email.Importance.ToUpper()}");
                    contextBuilder.AppendLine($"   - Summary: {email.Summary}");
                    contextBuilder.AppendLine($"   - Draft Reply: {email.DraftReply}");
                    contextBuilder.AppendLine();
                }
            }

            contextBuilder.AppendLine("=== CONVERSATION RULES ===");
            contextBuilder.AppendLine("- You have full read-access to the processed emails listed above. Answer questions about them accurately.");
            contextBuilder.AppendLine("- You have TOOLS available to send emails and send WhatsApp notifications.");
            contextBuilder.AppendLine("- If the user asks you to send an email, reply to an email, or schedule a meeting, USE the send_email tool.");
            contextBuilder.AppendLine("- If the user asks you to send a WhatsApp message, USE the send_whatsapp_message tool.");
            contextBuilder.AppendLine("- DO NOT ask for confirmation unless the user explicitly wants you to. Just execute the tool.");
            contextBuilder.AppendLine("- After using a tool, tell the user exactly what you did.");
            contextBuilder.AppendLine("- Keep your answers clean, structured, and easy to read.");

            // 3. Load previous Chat History from PostgreSQL database
            var dbHistory = await _chatHistoryRepo.GetSessionHistoryAsync(sessionId);
            
            // 4. Initialize Semantic Kernel ChatHistory
            var skHistory = new Microsoft.SemanticKernel.ChatCompletion.ChatHistory();
            skHistory.AddSystemMessage(contextBuilder.ToString());

            // Hydrate historical conversational flow
            foreach (var msg in dbHistory)
            {
                if (msg.Role == "user")
                {
                    skHistory.AddUserMessage(msg.Content);
                }
                else
                {
                    skHistory.AddAssistantMessage(msg.Content);
                }
            }

            // Append current message
            skHistory.AddUserMessage(userMessage);

            // Save user message to database
            await _chatHistoryRepo.AddAsync(new EmailAgent.Core.Entities.ChatHistory
            {
                SessionId = sessionId,
                Role = "user",
                Content = userMessage,
                CreatedAt = DateTime.UtcNow
            });

            // 5. Ask LLM completion with Tools enabled
            var executionSettings = new OpenAIPromptExecutionSettings
            {
                ToolCallBehavior = ToolCallBehavior.AutoInvokeKernelFunctions
            };

            var responseContent = await _chatCompletionService.GetChatMessageContentAsync(skHistory, executionSettings, _kernel);
            var assistantReply = responseContent.Content ?? "I couldn't process that request.";

            // Save assistant reply to database
            await _chatHistoryRepo.AddAsync(new EmailAgent.Core.Entities.ChatHistory
            {
                SessionId = sessionId,
                Role = "assistant",
                Content = assistantReply,
                CreatedAt = DateTime.UtcNow
            });

            return assistantReply;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing chatbot request in ChatService for Session: {SessionId}", sessionId);
            return "I apologize, but I encountered an internal error while querying my database. Please try again.";
        }
    }

    public async Task<IEnumerable<EmailAgent.Core.Entities.ChatHistory>> GetHistoryAsync(string sessionId)
    {
        return await _chatHistoryRepo.GetSessionHistoryAsync(sessionId);
    }

    public async Task ClearHistoryAsync(string sessionId)
    {
        await _chatHistoryRepo.ClearHistoryAsync(sessionId);
    }
}
