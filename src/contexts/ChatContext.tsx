import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { chatService } from '@/services/chatService';
import { socketService } from '@/services/socketService';
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
  const { isAuthenticated, loading: authLoading, token } = useAuth();
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});

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
      const sortedMessages = messagesData.reverse(); // Newest messages at the bottom
      setMessagesByChat(prev => ({
        ...prev,
        [chatId]: sortedMessages
      }));
      if (currentChat?.id === chatId) {
        setMessages(sortedMessages);
      }
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
    if (isAuthenticated && !authLoading) {
      fetchChats();
    }
  }, [isAuthenticated, authLoading]);

  useEffect(() => {
    if (currentChat) {
      // Only fetch messages if we haven't loaded them before
      if (!messagesByChat[currentChat.id]) {
        fetchMessages(currentChat.id);
      } else {
        // Use cached messages
        setMessages(messagesByChat[currentChat.id]);
      }
    }
  }, [currentChat]);

  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('ChatContext: Setting up WebSocket connection with token:', token);
      socketService.connect(token);

      const cleanup = socketService.onMessage((message) => {
        console.log('ChatContext: Received WebSocket message:', message);
        
        // Update messages if we're in the relevant chat
        if (currentChat?.id === message.chatId) {
          setMessages(prev => {
            // Skip if message already exists
            if (prev.some(m => m.id === message._id || m._id === message._id)) {
              console.log('ChatContext: Skipping duplicate message');
              return prev;
            }
            console.log('ChatContext: Adding new message to current chat');
            const newMessage = {
              id: message._id,
              _id: message._id,
              chatId: message.chatId,
              senderId: message.senderId,
              content: message.content,
              type: message.type,
              timestamp: message.timestamp,
              status: message.status,
              readBy: message.readBy || []
            };
            return [...prev, newMessage];
          });
        }

        // Update messages cache
        setMessagesByChat(prev => {
          const chatMessages = prev[message.chatId] || [];
          if (!chatMessages.some(m => m.id === message._id || m._id === message._id)) {
            const newMessage = {
              id: message._id,
              _id: message._id,
              chatId: message.chatId,
              senderId: message.senderId,
              content: message.content,
              type: message.type,
              timestamp: message.timestamp,
              status: message.status,
              readBy: message.readBy || []
            };
            console.log('ChatContext: Updated message cache for chat:', message.chatId);
            return {
              ...prev,
              [message.chatId]: [...chatMessages, newMessage]
            };
          }
          return prev;
        });

        // Update chat list
        setChats(prevChats => {
          const updatedChats = prevChats.map(chat => 
            chat.id === message.chatId 
              ? {
                  ...chat,
                  lastMessage: {
                    content: message.content,
                    senderId: message.senderId,
                    timestamp: message.timestamp
                  }
                }
              : chat
          );

          // Move the updated chat to the top
          const chatIndex = updatedChats.findIndex(chat => chat.id === message.chatId);
          if (chatIndex > 0) {
            const [chat] = updatedChats.splice(chatIndex, 1);
            updatedChats.unshift(chat);
          }

          console.log('ChatContext: Updated chat list with new message');
          return updatedChats;
        });
      });

      return () => {
        console.log('ChatContext: Cleaning up WebSocket connection');
        cleanup();
      };
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (currentChat?.id) {
      console.log('ChatContext: Joining chat room:', currentChat.id);
      socketService.joinChat(currentChat.id);
    }
  }, [currentChat?.id]);

  const selectChat = (chat: Chat) => {
    console.log('ChatContext: Selecting chat:', chat.id);
    setCurrentChat(chat);
    
    // Use cached messages if available
    if (messagesByChat[chat.id]) {
      console.log('ChatContext: Using cached messages');
      setMessages(messagesByChat[chat.id]);
    } else {
      console.log('ChatContext: Fetching messages for chat');
      fetchMessages(chat.id);
    }
  };

  const sendMessage = async (data: SendMessageRequest) => {
    try {
      console.log('ChatContext: Sending message:', data);
      const newMessage = await chatService.sendMessage(data);
      console.log('ChatContext: Message sent via HTTP:', newMessage);

      // Update UI immediately
      if (currentChat?.id === data.chatId) {
        setMessages(prev => {
          if (prev.some(m => m.id === newMessage._id || m._id === newMessage._id)) {
            return prev;
          }
          return [...prev, newMessage];
        });
      }

      // Update messages cache
      setMessagesByChat(prev => {
        const chatMessages = prev[data.chatId] || [];
        if (!chatMessages.some(m => m.id === newMessage._id || m._id === newMessage._id)) {
          return {
            ...prev,
            [data.chatId]: [...chatMessages, newMessage]
          };
        }
        return prev;
      });

      // Update chat list
      setChats(prevChats => {
        const updatedChats = prevChats.map(chat => 
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
        );

        // Move the updated chat to the top
        const chatIndex = updatedChats.findIndex(chat => chat.id === data.chatId);
        if (chatIndex > 0) {
          const [chat] = updatedChats.splice(chatIndex, 1);
          updatedChats.unshift(chat);
        }

        return updatedChats;
      });

      // Also send via WebSocket
      console.log('ChatContext: Sending message via WebSocket');
      socketService.sendMessage(data.chatId, data.content);
    } catch (error) {
      console.error('ChatContext: Error sending message:', error);
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

  // Don't render children until auth is ready
  if (authLoading) {
    return null;
  }

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
