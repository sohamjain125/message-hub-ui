
import { useRef, useEffect } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { formatMessageTime } from '@/utils/timeUtils';
import { Check, CheckCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

const ChatWindow = () => {
  const { currentChat, messages, messagesLoading } = useChat();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  if (!currentChat) {
    return (
      <EmptyState
        title="No chat selected"
        description="Select a conversation from the sidebar or create a new chat to get started."
      />
    );
  }

  // Using the utility function from utils/timeUtils.ts

  const renderStatusIcon = (status: string, readBy: string[]) => {
    if (status === 'read' && readBy.length > 1) {
      return <CheckCheck className="h-4 w-4 text-blue-500" />;
    }
    return <Check className="h-4 w-4" />;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background/50">
      {/* Chat header */}
      <div className="p-4 border-b flex items-center">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold truncate">
            {currentChat.type === 'group'
              ? currentChat.name
              : `Chat with ${currentChat.participants.find(id => id !== user?.id) || 'User'}`}
          </h2>
          <p className="text-sm text-muted-foreground truncate">
            {currentChat.type === 'group'
              ? `${currentChat.participants.length} participants`
              : 'Private conversation'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <LoadingSpinner size={40} className="text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <EmptyState 
              title="No messages yet" 
              description="Be the first one to send a message in this conversation." 
            />
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === user?.id;

            return (
              <div
                key={message.id}
                className={cn("flex", isOwnMessage ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-lg p-3 space-y-1",
                    isOwnMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-accent"
                  )}
                >
                  <p>{message.content}</p>
                  <div className="flex justify-end items-center space-x-1 text-xs opacity-70">
                    <span>{formatMessageTime(message.timestamp)}</span>
                    {isOwnMessage && renderStatusIcon(message.status, message.readBy)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
