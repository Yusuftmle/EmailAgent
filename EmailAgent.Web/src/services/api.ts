import axios from 'axios';

const API_BASE_URL = 'http://localhost:5209'; // Matches the actual .NET API Development port

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('jwt');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;

export interface EmailAnalysis {
  id: number;
  gmailId: string;
  from: string;
  subject: string;
  summary: string;
  draftReply: string;
  importance: 'important' | 'normal' | 'spam';
  processedAt: string;
}

export interface UserPreferences {
  id?: number;
  userEmail?: string;
  focusCompanies: string[];
  keywords: string[];
  pairingCode?: string;
  telegramChatId?: string;
  whatsAppToken?: string;
  whatsAppFrom?: string;
  whatsAppTo?: string;
  aiProvider?: 'Claude' | 'Gemini' | 'Groq';
  apiKey?: string;
  whatsAppSid?: string;
  telegramBotToken?: string;
  shoppingTrackerIntervalHours?: number;
}

export interface ChatHistoryMessage {
  id?: number;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

// Mock data fallbacks in case the backend server is not running
const mockEmails: EmailAnalysis[] = [
  {
    id: 1,
    gmailId: "msg_101",
    from: "Satya Nadella <satya@microsoft.com>",
    subject: "Strategic Partnership Alignment Discussion",
    summary: "Microsoft CEO Satya Nadella reaches out to propose a high-level alignment meeting regarding cloud infrastructure integration. He requests availability for a 30-minute sync next Thursday. The message stresses that this is a priority proposal.",
    draftReply: "Dear Satya,\n\nThank you for reaching out. I would be absolutely delighted to discuss our strategic partnership alignment. I am fully available next Thursday at 3:00 PM EST, or at your convenience.\n\nI look forward to our conversation.\n\nBest regards,\n[My Name]",
    importance: "important",
    processedAt: new Date().toISOString()
  },
  {
    id: 2,
    gmailId: "msg_102",
    from: "AWS Cloud Support <support@amazon.com>",
    subject: "Action Required: AWS Database Cluster Alert",
    summary: "An automated billing and maintenance alert notifying that the primary PostgreSQL database cluster has reached 88% capacity. It suggests reviewing indexing strategies or scaling the instance size to avoid service interruptions.",
    draftReply: "Dear AWS Support,\n\nThank you for the notification regarding the database cluster capacity. I will coordinate with our engineering team immediately to review our database indexing and allocate additional storage options.\n\nBest regards,\n[My Name]",
    importance: "important",
    processedAt: new Date().toISOString()
  },
  {
    id: 3,
    gmailId: "msg_103",
    from: "GitHub Events <noreply@github.com>",
    subject: "[GitHub] Pull Request #43 merged into staging",
    summary: "A standard notification confirming that Pull Request #43 adding modular layout fixes has been successfully compiled, tested, and merged into the staging branch by co-developer Alex.",
    draftReply: "Hi Alex,\n\nThanks for merging the staging layout adjustments. I'll pull the changes and verify locally.\n\nBest,\n[My Name]",
    importance: "normal",
    processedAt: new Date().toISOString()
  },
  {
    id: 4,
    gmailId: "msg_104",
    from: "Crypto Winner Pro <info@win-big-token.xyz>",
    subject: "🚨 [Alert] You've won 200,000 BigCoins! Claim inside",
    summary: "An unsolicited spam message claiming the recipient has been selected in a promotional crypto raffle to receive 200,000 tokens. It requires clicking an unverified external link to claim the reward.",
    draftReply: "",
    importance: "spam",
    processedAt: new Date().toISOString()
  }
];

let mockPreferences: UserPreferences = {
  focusCompanies: ["Microsoft", "Amazon", "Google", "Tesla"],
  keywords: ["partnership", "alert", "database", "priority", "critical"]
};

let mockChatHistory: ChatHistoryMessage[] = [
  {
    role: "assistant",
    sessionId: "default",
    content: "Hello! I am your AI Email Assistant. I have loaded today's parsed emails. How can I help you manage your daily inbox today?"
  }
];

export const apiService = {
  async getDailySummary(): Promise<EmailAnalysis[]> {
    try {
      const response = await client.get<EmailAnalysis[]>('/api/emails/daily-summary');
      return response.data;
    } catch (error) {
      console.warn("API Offline. Falling back to mock email summaries.");
      return mockEmails;
    }
  },

  async getEmailById(id: number): Promise<EmailAnalysis> {
    try {
      const response = await client.get<EmailAnalysis>(`/api/emails/${id}`);
      return response.data;
    } catch (error) {
      const found = mockEmails.find(e => e.id === id);
      if (found) return found;
      throw new Error(`Email ID ${id} not found in mock store.`);
    }
  },

  async regenerateDraft(id: number): Promise<EmailAnalysis> {
    try {
      const response = await client.post<EmailAnalysis>(`/api/emails/${id}/draft`);
      return response.data;
    } catch (error) {
      console.warn("API Offline. Performing simulated draft regeneration.");
      const email = mockEmails.find(e => e.id === id);
      if (email) {
        email.draftReply = `[Simulated Regenerated Reply at ${new Date().toLocaleTimeString()}]\n\nDear sender,\n\nI have received your request and am reviewing the details. Let's schedule a quick call to map out the next steps.\n\nWarm regards,\n[My Name]`;
        return { ...email };
      }
      throw new Error("Email not found");
    }
  },

  async triggerJobNow(): Promise<{ jobId: string; message: string }> {
    try {
      const response = await client.post<{ jobId: string; message: string }>('/api/jobs/run-now');
      return response.data;
    } catch (error) {
      console.warn("API Offline. Simulating background job trigger.");
      return { jobId: "simulated_job_88", message: "Background processing simulated." };
    }
  },

  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await client.get<UserPreferences>('/api/preferences');
      return response.data;
    } catch (error) {
      return mockPreferences;
    }
  },

  async savePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    try {
      const response = await client.post<UserPreferences>('/api/preferences', preferences);
      return response.data;
    } catch (error) {
      mockPreferences = { ...preferences };
      return mockPreferences;
    }
  },

  async getChatHistory(sessionId: string): Promise<ChatHistoryMessage[]> {
    try {
      const response = await client.get<ChatHistoryMessage[]>(`/api/chat/history?sessionId=${sessionId}`);
      return response.data;
    } catch (error) {
      return mockChatHistory.filter(c => c.sessionId === sessionId);
    }
  },

  async sendChatMessage(sessionId: string, message: string): Promise<{ reply: string }> {
    try {
      const response = await client.post<{ reply: string; sessionId: string }>('/api/chat/message', {
        sessionId,
        message,
      });
      return { reply: response.data.reply };
    } catch (error) {
      console.warn("API Offline. Generating simulated Claude reply.");
      // Record user message
      mockChatHistory.push({ role: 'user', sessionId, content: message });
      
      let reply = "I can see your request, but I'm currently running in standalone demo mode. When you launch your .NET 9 API backend, I will query Claude Sonnet 4.5 and the live PostgreSQL database to answer you directly!";
      
      const lower = message.toLowerCase();
      if (lower.includes("important") || lower.includes("today's emails")) {
        reply = `Looking at today's emails in the demo database, you have **2 important emails**:\n\n1. **From:** Satya Nadella (Microsoft) - *Strategic Partnership Alignment Discussion*\n2. **From:** AWS Cloud Support - *Action Required: AWS Database Cluster Alert*\n\nWould you like me to draft customized responses to either of these messages?`;
      } else if (lower.includes("satya") || lower.includes("microsoft")) {
        reply = `Satya Nadella proposed a 30-minute sync next Thursday. Here is the draft response I have prepared for you:\n\n\`\`\`\nDear Satya,\n\nThank you for reaching out. I am available next Thursday at 3:00 PM EST...\n\`\`\`\n\nWould you like me to modify the meeting times or finalize the draft?`;
      }

      mockChatHistory.push({ role: 'assistant', sessionId, content: reply });
      return new Promise(resolve => setTimeout(() => resolve({ reply }), 600));
    }
  },

  async clearChatHistory(sessionId: string): Promise<void> {
    try {
      await client.delete(`/api/chat/history?sessionId=${sessionId}`);
    } catch (error) {
      mockChatHistory = mockChatHistory.filter(c => c.sessionId !== sessionId);
    }
  }
};
