
import { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SendHorizontal } from 'lucide-react';

const MessageInput = () => {
  const { currentChat, sendMessage } = useChat();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim() || !currentChat) return;
    
    try {
      setIsSubmitting(true);
      await sendMessage({
        chatId: currentChat.id,
        content: message.trim(),
      });
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!currentChat) return null;

  return (
    <div className="p-4 border-t bg-background">
      <div className="flex space-x-2">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="min-h-10 max-h-32"
          disabled={isSubmitting}
        />
        <Button 
          onClick={handleSendMessage} 
          disabled={!message.trim() || isSubmitting}
          size="icon"
        >
          <SendHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput;
