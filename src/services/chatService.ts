import api from '@/lib/api';
import {
  Chat,
  Message,
  CreatePrivateChatRequest,
  CreateGroupChatRequest,
  SendMessageRequest,
  ApiResponse
} from '@/lib/types';
import axios from 'axios';

const CHAT_API = 'http://localhost:8080/api/v1/chats';

// Helper function to map backend chat to frontend chat
const mapBackendChatToFrontend = (backendChat: any): Chat => ({
  id: backendChat._id,
  type: backendChat.type,
  name: backendChat.name,
  participants: backendChat.participants,
  createdAt: backendChat.createdAt,
  lastMessage: backendChat.lastMessage
});

// Helper function to map backend message to frontend message
const mapBackendMessageToFrontend = (backendMessage: any): Message => ({
  id: backendMessage._id,
  chatId: backendMessage.chatId,
  senderId: backendMessage.senderId,
  content: backendMessage.content,
  type: backendMessage.type,
  timestamp: backendMessage.timestamp,
  status: backendMessage.status,
  readBy: backendMessage.readBy || []
});

export const chatService = {
  // Get all user chats
  getUserChats: async (): Promise<Chat[]> => {
    try {
      const response = await api.get<ApiResponse<{ chats: any[] }>>(`${CHAT_API}`);
      return (response.data.data?.chats || []).map(mapBackendChatToFrontend);
    } catch (error) {
      console.error('Error fetching user chats:', error);
      throw error;
    }
  },

  // Create private chat
  createPrivateChat: async (data: CreatePrivateChatRequest): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: any }>>(`${CHAT_API}/private`, data);
      return mapBackendChatToFrontend(response.data.data?.chat);
    } catch (error) {
      console.error('Error creating private chat:', error);
      throw error;
    }
  },

  // Create group chat
  createGroupChat: async (data: CreateGroupChatRequest): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: any }>>(`${CHAT_API}/group`, data);
      return mapBackendChatToFrontend(response.data.data?.chat);
    } catch (error) {
      console.error('Error creating group chat:', error);
      throw error;
    }
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page = 1, limit = 50): Promise<Message[]> => {
    try {
      const response = await api.get<ApiResponse<{ messages: any[] }>>(
        `${CHAT_API}/${chatId}/messages?page=${page}&limit=${limit}`
      );
      return (response.data.data?.messages || []).map(mapBackendMessageToFrontend);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      throw error;
    }
  },

  // Send message
  sendMessage: async (data: SendMessageRequest): Promise<Message> => {
    try {
      const response = await api.post<ApiResponse<{ message: any }>>(
        `${CHAT_API}/${data.chatId}/messages`,
        {
          content: data.content,
          type: data.type || 'text'
        }
      );
      
      if (!response.data.data?.message) {
        throw new Error('No message in response');
      }

      const message = response.data.data.message;
      return {
        id: message._id,
        chatId: message.chatId,
        senderId: message.senderId,
        content: message.content,
        type: message.type,
        timestamp: message.timestamp,
        status: message.status,
        readBy: message.readBy,
        _id: message._id
      };
    } catch (error) {
      console.error('ChatService: Error sending message:', error);
      throw error;
    }
  },

  // Add participant to group chat
  addParticipant: async (chatId: string, participantId: string): Promise<Chat> => {
    try {
      const response = await api.post<ApiResponse<{ chat: any }>>(
        `${CHAT_API}/${chatId}/participants`,
        { participantId }
      );
      return mapBackendChatToFrontend(response.data.data?.chat);
    } catch (error) {
      console.error('Error adding participant:', error);
      throw error;
    }
  },

  // Remove participant from group chat
  removeParticipant: async (chatId: string, participantId: string): Promise<Chat> => {
    try {
      const response = await api.delete<ApiResponse<{ chat: any }>>(
        `${CHAT_API}/${chatId}/participants/${participantId}`
      );
      return mapBackendChatToFrontend(response.data.data?.chat);
    } catch (error) {
      console.error('Error removing participant:', error);
      throw error;
    }
  },

  // Add reaction to message
  addReaction: async (messageId: string, reaction: string): Promise<Message> => {
    try {
      const response = await api.post<ApiResponse<{ message: any }>>(
        `${CHAT_API}/messages/${messageId}/reactions`,
        { reaction }
      );
      return mapBackendMessageToFrontend(response.data.data?.message);
    } catch (error) {
      console.error('Error adding reaction:', error);
      throw error;
    }
  },

  // Remove reaction from message
  removeReaction: async (messageId: string, reaction: string): Promise<Message> => {
    try {
      const response = await api.delete<ApiResponse<{ message: any }>>(
        `${CHAT_API}/messages/${messageId}/reactions`,
        { data: { reaction } }
      );
      return mapBackendMessageToFrontend(response.data.data?.message);
    } catch (error) {
      console.error('Error removing reaction:', error);
      throw error;
    }
  }
};
