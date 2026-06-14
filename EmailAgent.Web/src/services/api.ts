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
  isInStock: boolean;
  imageUrl?: string;
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

export const apiService = {
  async getDailySummary(): Promise<EmailAnalysis[]> {
    const response = await client.get<EmailAnalysis[]>('/api/emails/daily-summary');
    return response.data;
  },

  async getEmailById(id: number): Promise<EmailAnalysis> {
    const response = await client.get<EmailAnalysis>(`/api/emails/${id}`);
    return response.data;
  },

  async regenerateDraft(id: number): Promise<EmailAnalysis> {
    const response = await client.post<EmailAnalysis>(`/api/emails/${id}/draft`);
    return response.data;
  },

  async triggerJobNow(): Promise<{ jobId: string; message: string }> {
    const response = await client.post<{ jobId: string; message: string }>('/api/jobs/run-now');
    return response.data;
  },

  async getPreferences(): Promise<UserPreferences> {
    const response = await client.get<UserPreferences>('/api/preferences');
    return response.data;
  },

  async savePreferences(preferences: UserPreferences): Promise<UserPreferences> {
    const response = await client.post<UserPreferences>('/api/preferences', preferences);
    return response.data;
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
    const response = await client.get<ChatHistoryMessage[]>(`/api/chat/history?sessionId=${sessionId}`);
    return response.data;
  },

  async sendChatMessage(sessionId: string, message: string): Promise<{ reply: string }> {
    const response = await client.post<{ reply: string; sessionId: string }>('/api/chat/message', {
      sessionId,
      message,
    });
    return { reply: response.data.reply };
  },

  async sendVoiceMessage(sessionId: string, audioBlob: Blob): Promise<{ reply: string; transcribedText?: string }> {
    const formData = new FormData();
    formData.append('audioFile', audioBlob, 'voice.webm');
    formData.append('sessionId', sessionId);
    
    const response = await client.post<{ reply: string; sessionId: string; transcribedText?: string }>('/api/chat/voice', formData);
    return { reply: response.data.reply, transcribedText: response.data.transcribedText };
  },

  async uploadDocument(sessionId: string, file: File): Promise<{ reply: string; transcribedText?: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('sessionId', sessionId);
    
    const response = await client.post<{ reply: string; sessionId: string; transcribedText?: string }>('/api/chat/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return { reply: response.data.reply, transcribedText: response.data.transcribedText };
  },

  async clearChatHistory(sessionId: string): Promise<void> {
    await client.delete(`/api/chat/history?sessionId=${sessionId}`);
  },

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const response = await client.get<DashboardStats>(`/api/dashboard/stats?userId=${userId}`);
    return response.data;
  },

  async getTrackedProducts(userId: string): Promise<TrackedProduct[]> {
    const response = await client.get<TrackedProduct[]>(`/api/dashboard/tracked-products?userId=${userId}`);
    return response.data;
  },

  async getTrackedCategories(userId: string): Promise<TrackedCategory[]> {
    const response = await client.get<TrackedCategory[]>(`/api/dashboard/tracked-categories?userId=${userId}`);
    return response.data;
  },

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    const response = await client.get<PriceHistory[]>(`/api/dashboard/price-history/${productId}`);
    return response.data;
  },

  async getNotificationLogs(userId: string): Promise<NotificationLog[]> {
    const response = await client.get<NotificationLog[]>(`/api/dashboard/notification-log?userId=${userId}`);
    return response.data;
  }
};
