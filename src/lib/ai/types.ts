// AI聊天相关类型定义

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
}

export interface ChatState {
  currentChatId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  selectedModel: string;
}

export interface ChatActions {
  sendMessage: (content: string) => void;
  createNewChat: () => void;
  setSelectedModel: (modelId: string) => void;
  clearError: () => void;
}
