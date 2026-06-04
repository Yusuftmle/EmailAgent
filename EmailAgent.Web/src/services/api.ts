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
  city?: string;
  timezone?: string;
  assistantPersona?: string;
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
  focusCompanies?: string[];
  keywords?: string[];
  enableEmailFeature?: boolean;
  enableShoppingFeature?: boolean;
  enableFinanceFeature?: boolean;
  enableWebSearchFeature?: boolean;
  enableDocumentAnalysisFeature?: boolean;
  enableRemindersFeature?: boolean;
  enableCalendarFeature?: boolean;
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
  assistantPersona: "Sen enerjik, samimi ve motive edici bir yapay zeka asistanısın. Kullanıcıya her zaman yardımcı ol."
};

export interface DashboardStats {
  totalEmails: number;
  totalChats: number;
  totalTrackedProducts: number;
  hoursSaved: number;
  totalSavings: number;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  url: string;
  title: string;
  targetPrice: number;
  lastKnownPrice: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  lastCheckedAt: string;
}

export interface TrackedCategory {
  id: string;
  userId: string;
  categoryUrl: string;
  categoryName: string;
  minDiscountPercentage: number;
  requiredFeatures?: string;
  comparisonGroupId?: string;
  createdAt: string;
  lastCheckedAt?: string;
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  isInStock: boolean;
  checkedAt: string;
}

export interface NotificationLog {
  id: string;
  userId: string;
  message: string;
  type: string;
  sentAt: string;
}

export interface CalendarEvent {
  id?: string;
  userId?: string;
  title: string;
  description?: string;
  eventDate: string;
  isCompleted?: boolean;
  createdAt?: string;
}

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

  // Calendar API
  async getEvents(): Promise<CalendarEvent[]> {
    const response = await client.get<CalendarEvent[]>('/api/calendar');
    return response.data;
  },

  async addEvent(event: CalendarEvent): Promise<CalendarEvent> {
    const response = await client.post<CalendarEvent>('/api/calendar', event);
    return response.data;
  },

  async updateEvent(id: string, event: CalendarEvent): Promise<void> {
    await client.put(`/api/calendar/${id}`, event);
  },

  async deleteEvent(id: string): Promise<void> {
    await client.delete(`/api/calendar/${id}`);
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
      mockChatHistory.push({ role: 'user', sessionId, content: message });
      let reply = "I can see your request, but I'm currently running in standalone demo mode. When you launch your .NET 9 API backend, I will query Claude Sonnet 4.5 and the live PostgreSQL database to answer you directly!";
      mockChatHistory.push({ role: 'assistant', sessionId, content: reply });
      return new Promise(resolve => setTimeout(() => resolve({ reply }), 600));
    }
  },

  async sendVoiceMessage(sessionId: string, audioBlob: Blob): Promise<{ reply: string; transcribedText?: string }> {
    try {
      const formData = new FormData();
      formData.append('audioFile', audioBlob, 'voice.webm');
      formData.append('sessionId', sessionId);
      
      const response = await client.post<{ reply: string; sessionId: string; transcribedText?: string }>('/api/chat/voice', formData);
      return { reply: response.data.reply, transcribedText: response.data.transcribedText };
    } catch (error) {
      console.error("Failed to send voice message:", error);
      throw error;
    }
  },

  async clearChatHistory(sessionId: string): Promise<void> {
    try {
      await client.delete(`/api/chat/history?sessionId=${sessionId}`);
    } catch (err: unknown) {
      mockChatHistory = mockChatHistory.filter(c => c.sessionId !== sessionId);
      console.warn("API Offline. Cleared simulated history for " + sessionId);
    }
  },

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const response = await client.get<DashboardStats>(`/api/dashboard/stats?userId=${userId}`);
      return response.data;
    } catch (error) {
      return { totalEmails: 24, totalChats: 12, totalTrackedProducts: 3, hoursSaved: 4.2, totalSavings: 0 };
    }
  },

  async getTrackedProducts(userId: string): Promise<TrackedProduct[]> {
    try {
      const response = await client.get<TrackedProduct[]>(`/api/dashboard/tracked-products?userId=${userId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getTrackedCategories(userId: string): Promise<TrackedCategory[]> {
    try {
      const response = await client.get<TrackedCategory[]>(`/api/dashboard/tracked-categories?userId=${userId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    try {
      const response = await client.get<PriceHistory[]>(`/api/dashboard/price-history/${productId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  },

  async getNotificationLogs(userId: string): Promise<NotificationLog[]> {
    try {
      const response = await client.get<NotificationLog[]>(`/api/dashboard/notification-log?userId=${userId}`);
      return response.data;
    } catch (error) {
      return [];
    }
  }
};
