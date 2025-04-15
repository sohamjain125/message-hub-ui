
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { chatService } from '@/services/chatService';
import { Chat, Message, SendMessageRequest, CreatePrivateChatRequest, CreateGroupChatRequest } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from './AuthContext';

interface ChatContextType {
  chats: Chat[];
  currentChat: Chat | null;
  messages: Message[];
  loading: boolean;
  messagesLoading: boolean;
  selectChat: (chat: Chat) => void;
  sendMessage: (data: SendMessageRequest) => Promise<void>;
  createPrivateChat: (data: CreatePrivateChatRequest) => Promise<void>;
  createGroupChat: (data: CreateGroupChatRequest) => Promise<void>;
  addParticipant: (chatId: string, participantId: string) => Promise<void>;
  removeParticipant: (chatId: string, participantId: string) => Promise<void>;
  refreshChats: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const fetchChats = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const chatsData = await chatService.getUserChats();
      setChats(chatsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load chats",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      setMessagesLoading(true);
      const messagesData = await chatService.getChatMessages(chatId);
      setMessages(messagesData.reverse()); // Newest messages at the bottom
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (currentChat) {
      fetchMessages(currentChat.id);
    }
  }, [currentChat]);

  const selectChat = (chat: Chat) => {
    setCurrentChat(chat);
  };

  const sendMessage = async (data: SendMessageRequest) => {
    try {
      const newMessage = await chatService.sendMessage(data);
      setMessages(prev => [...prev, newMessage]);
      
      // Update the last message in the chat list
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === data.chatId 
            ? {
                ...chat,
                lastMessage: {
                  content: data.content,
                  senderId: newMessage.senderId,
                  timestamp: newMessage.timestamp
                }
              }
            : chat
        )
      );
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const createPrivateChat = async (data: CreatePrivateChatRequest) => {
    try {
      const newChat = await chatService.createPrivateChat(data);
      setChats(prev => [newChat, ...prev]);
      selectChat(newChat);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create private chat",
        variant: "destructive",
      });
    }
  };

  const createGroupChat = async (data: CreateGroupChatRequest) => {
    try {
      const newChat = await chatService.createGroupChat(data);
      setChats(prev => [newChat, ...prev]);
      selectChat(newChat);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create group chat",
        variant: "destructive",
      });
    }
  };

  const addParticipant = async (chatId: string, participantId: string) => {
    try {
      const updatedChat = await chatService.addParticipant(chatId, participantId);
      setChats(prev => 
        prev.map(chat => chat.id === chatId ? updatedChat : chat)
      );
      
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(updatedChat);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add participant",
        variant: "destructive",
      });
    }
  };

  const removeParticipant = async (chatId: string, participantId: string) => {
    try {
      const updatedChat = await chatService.removeParticipant(chatId, participantId);
      setChats(prev => 
        prev.map(chat => chat.id === chatId ? updatedChat : chat)
      );
      
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat(updatedChat);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      });
    }
  };

  const refreshChats = async () => {
    await fetchChats();
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        currentChat,
        messages,
        loading,
        messagesLoading,
        selectChat,
        sendMessage,
        createPrivateChat,
        createGroupChat,
        addParticipant,
        removeParticipant,
        refreshChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
