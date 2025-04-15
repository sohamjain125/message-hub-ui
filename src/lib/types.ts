
// Auth Types
export interface User {
  id: string;
  username: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Chat Types
export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: "text" | "image" | "file";
  timestamp: string;
  status: "sent" | "delivered" | "read";
  readBy: string[];
}

export interface Chat {
  id: string;
  type: "private" | "group";
  name?: string;
  participants: string[];
  lastMessage?: {
    content: string;
    timestamp: string;
    senderId: string;
  };
  createdAt: string;
}

export interface CreatePrivateChatRequest {
  userId: string;
}

export interface CreateGroupChatRequest {
  name: string;
  participants: string[];
}

export interface SendMessageRequest {
  chatId: string;
  content: string;
  type?: "text" | "image" | "file";
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T | null;
}
