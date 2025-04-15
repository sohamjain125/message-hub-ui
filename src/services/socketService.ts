import { io, Socket } from 'socket.io-client';
import { Message } from '@/lib/types';

const SOCKET_URL = 'http://localhost:8080';

class SocketService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];
  private currentChatId: string | null = null;

  connect(token: string) {
    console.log('SocketService: Starting connection process with token:', token);

    if (this.socket?.connected) {
      console.log('SocketService: Socket already connected');
      return;
    }

    try {
      if (this.socket) {
        console.log('SocketService: Disconnecting existing socket');
        this.socket.disconnect();
        this.socket = null;
      }

      console.log('SocketService: Creating new socket connection');
      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: false
      });

      this.socket.on('connect', () => {
        console.log('SocketService: Connected successfully');
        console.log('SocketService: Socket ID:', this.socket?.id);
        
        // Join all user's chats when connected
        console.log('SocketService: Joining all user chats');
        this.socket?.emit('join-chats');
      });

      this.socket.on('connect_error', (error) => {
        console.error('SocketService: Connection error:', error);
      });

      this.socket.on('error', (error: any) => {
        console.error('SocketService: Socket error:', error);
      });

      this.socket.on('new-message', (message: any) => {
        console.log('SocketService: Received new-message event:', message);
        
        // Ensure all required fields are present
        if (!message._id || !message.chatId || !message.senderId || !message.content) {
          console.error('SocketService: Received invalid message format:', message);
          return;
        }

        const mappedMessage: Message = {
          id: message._id,
          _id: message._id,
          chatId: message.chatId,
          senderId: message.senderId,
          content: message.content,
          type: message.type || 'text',
          timestamp: message.timestamp || new Date().toISOString(),
          status: message.status || 'sent',
          readBy: message.readBy || []
        };
        
        console.log('SocketService: Mapped message:', mappedMessage);
        this.messageHandlers.forEach(handler => {
          try {
            console.log('SocketService: Calling message handler');
            handler(mappedMessage);
          } catch (error) {
            console.error('SocketService: Error in message handler:', error);
          }
        });
      });

      this.socket.on('message-status', (data: { messageId: string; status: string; userId: string }) => {
        console.log('SocketService: Received message status update:', data);
      });

      this.socket.on('typing', (data: { userId: string; chatId: string }) => {
        console.log('SocketService: Received typing indicator:', data);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('SocketService: Disconnected from server. Reason:', reason);
        // Try to reconnect after disconnect
        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('SocketService: Attempting to reconnect...');
            this.socket?.connect();
          }
        }, 1000);
      });

      console.log('SocketService: Attempting to connect...');
      this.socket.connect();
    } catch (error) {
      console.error('SocketService: Error during socket setup:', error);
    }
  }

  disconnect() {
    console.log('SocketService: Disconnecting socket');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChatId = null;
      console.log('SocketService: Socket disconnected');
    }
  }

  onMessage(handler: (message: Message) => void) {
    console.log('SocketService: Adding message handler');
    this.messageHandlers.push(handler);
    return () => {
      console.log('SocketService: Removing message handler');
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  joinChat(chatId: string) {
    console.log('SocketService: Joining chat:', chatId);
    this.currentChatId = chatId;
    
    if (this.socket?.connected) {
      console.log('SocketService: Emitting join-chat event');
      this.socket.emit('join-chat', chatId);
    } else {
      console.log('SocketService: Socket not connected, will join when connected');
    }
  }

  sendMessage(chatId: string, content: string, chatType: 'private' | 'group' = 'private') {
    console.log('SocketService: Sending message to chat:', chatId, 'Type:', chatType);
    if (!this.socket?.connected) {
      console.error('SocketService: Cannot send message - socket not connected');
      return;
    }

    console.log('SocketService: Emitting message event with data:', { chatId, content, type: chatType });
    this.socket.emit('message', { chatId, content, type: chatType }, (response: any) => {
      if (response?.error) {
        console.error('SocketService: Error sending message:', response.error);
        
        // Handle specific error cases
        switch (response.error.code) {
          case 'NOT_IN_CHAT':
            console.error('SocketService: User is not part of this chat');
            break;
          case 'SAVE_FAILED':
            console.error('SocketService: Failed to save message to database');
            break;
          case 'CHAT_NOT_FOUND':
            console.error('SocketService: Chat not found');
            break;
          case 'UNKNOWN_ERROR':
            console.error('SocketService: Unknown error occurred:', response.error.details);
            break;
          default:
            console.error('SocketService: Unhandled error:', response.error);
        }
      } else {
        console.log('SocketService: Message sent successfully via WebSocket');
      }
    });
  }

  sendTypingIndicator(chatId: string, chatType: 'private' | 'group' = 'private') {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatId, type: chatType });
    }
  }

  markMessageAsRead(messageId: string, chatId: string, chatType: 'private' | 'group' = 'private') {
    if (this.socket?.connected) {
      this.socket.emit('read', { messageId, chatId, type: chatType });
    }
  }

  onError(handler: (error: { message: string; code?: string; details?: string }) => void) {
    this.socket?.on('error', (error: any) => {
      console.error('SocketService: Socket error:', error);
      handler(error);
    });
  }
}

export const socketService = new SocketService(); 