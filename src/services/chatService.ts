
import api from '@/lib/api';
import {
  Chat,
  Message,
  CreatePrivateChatRequest,
  CreateGroupChatRequest,
  SendMessageRequest,
  ApiResponse
} from '@/lib/types';

const CHAT_API = '/api/v1/chat';

export const chatService = {
  // Get all user chats
  getUserChats: async (): Promise<Chat[]> => {
    try {
      const response = await api.get<ApiResponse<{ chats: Chat[] }>>(`${CHAT_API}/user-chats`);
      return response.data.data?.chats || [];
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  },

  // Create private chat
  createPrivateChat: async (data: CreatePrivateChatRequest): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: Chat }>>(`${CHAT_API}/private`, data);
      return response.data.data?.chat as Chat;
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (data: CreateGroupChatRequest): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: Chat }>>(`${CHAT_API}/group`, data);
      return response.data.data?.chat as Chat;
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    try {
      const response = await api.get<ApiResponse<{ messages: Message[] }>>(
        `${CHAT_API}/messages/${chatId}?page=${page}&limit=${limit}`
      );
      return response.data.data?.messages || [];
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    try {
      const response = await api.post<ApiResponse<{ message: Message }>>(`${CHAT_API}/message`, data);
      return response.data.data?.message as Message;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Add participant to group chat
  addParticipant: async (chatId: string, participantId: string): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: Chat }>>(
        `${CHAT_API}/${chatId}/participants`,
        { participantId }
      );
      return response.data.data?.chat as Chat;
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  },

  // Remove participant from group chat
  removeParticipant: async (chatId: string, participantId: string): Promise<Chat> => {
    try {
      const response = await api.delete<ApiResponse<{ chat: Chat }>>(
        `${CHAT_API}/${chatId}/participants/${participantId}`
      );
      return response.data.data?.chat as Chat;
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  }
};
