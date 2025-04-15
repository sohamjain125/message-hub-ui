
import ChatSidebar from '@/components/ChatSidebar';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const ChatPage = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loading state or redirect if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="mb-4">
            <LoadingSpinner size={48} className="text-primary" />
          </div>
          <p className="text-muted-foreground">Loading your conversations...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        {/* Chat sidebar - 1/4 of the screen */}
        <div className="w-80 md:w-96 flex-shrink-0">
          <ChatSidebar />
        </div>
        
        {/* Chat main area - 3/4 of the screen */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow />
          <MessageInput />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
