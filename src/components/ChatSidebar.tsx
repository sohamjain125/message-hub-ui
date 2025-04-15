
import { useState } from 'react';
import { useChat } from '@/contexts/ChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/lib/types';
import { formatChatTime } from '@/utils/timeUtils';
import { Button } from '@/components/ui/button';
import { PlusCircle, Users, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ChatSidebar = () => {
  const { chats, currentChat, selectChat, createPrivateChat, createGroupChat } = useChat();
  const { user, logout } = useAuth();
  const [isNewPrivateChatOpen, setIsNewPrivateChatOpen] = useState(false);
  const [isNewGroupChatOpen, setIsNewGroupChatOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [groupName, setGroupName] = useState('');
  const [participants, setParticipants] = useState('');

  const handleCreatePrivateChat = () => {
    if (!userId) return;
    createPrivateChat({ userId });
    setIsNewPrivateChatOpen(false);
    setUserId('');
  };

  const handleCreateGroupChat = () => {
    if (!groupName || !participants) return;
    
    // Convert comma-separated string to array
    const participantIds = participants.split(',').map(id => id.trim());
    
    createGroupChat({ name: groupName, participants: participantIds });
    setIsNewGroupChatOpen(false);
    setGroupName('');
    setParticipants('');
  };

  // Using the utility function from utils/timeUtils.ts

  return (
    <div className="flex flex-col h-full border-r bg-background">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chats</h2>
        <div className="flex space-x-2">
          <Dialog open={isNewPrivateChatOpen} onOpenChange={setIsNewPrivateChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="New Private Chat">
                <User className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Private Chat</DialogTitle>
                <DialogDescription>
                  Enter the user ID you want to chat with.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    placeholder="Enter user ID"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreatePrivateChat}>Create Chat</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isNewGroupChatOpen} onOpenChange={setIsNewGroupChatOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" title="New Group Chat">
                <Users className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Group Chat</DialogTitle>
                <DialogDescription>
                  Create a new group chat with multiple users.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="participants">Participant IDs (comma-separated)</Label>
                  <Input
                    id="participants"
                    placeholder="e.g. user1, user2, user3"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroupChat}>Create Group</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <PlusCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium mb-2">No conversations yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create a new chat to get started</p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setIsNewPrivateChatOpen(true)}>
                <User className="h-4 w-4 mr-2" />
                Private Chat
              </Button>
              <Button size="sm" onClick={() => setIsNewGroupChatOpen(true)}>
                <Users className="h-4 w-4 mr-2" />
                Group Chat
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y">
            {chats.map((chat) => (
              <li key={chat.id}>
                <button
                  className={cn(
                    "w-full text-left px-4 py-3 hover:bg-accent transition-colors flex items-start",
                    chat.id === currentChat?.id && "bg-accent"
                  )}
                  onClick={() => selectChat(chat)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate">
                        {chat.type === 'group' 
                          ? chat.name 
                          : `Chat with ${chat.participants.find(id => id !== user?.id) || 'User'}`}
                      </h3>
                      {chat.lastMessage && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatChatTime(chat.lastMessage.timestamp)}
                        </span>
                      )}
                    </div>
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage.senderId === user?.id ? 'You: ' : ''}
                        {chat.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
