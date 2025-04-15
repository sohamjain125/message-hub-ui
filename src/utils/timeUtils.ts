import { formatDistanceToNow, format } from 'date-fns';

export const formatMessageTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    
    // If the message is from today, show the time (e.g., "12:34 PM")
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm');
    }
    
    // Otherwise show relative time like "2 days ago"
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    return '';
  }
};

export const formatChatTime = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    
    // If the chat is from today, show the time (e.g., "12:34 PM")
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return format(date, 'HH:mm');
    }
    
    // If the chat is from this week, show the day name (e.g., "Monday")
    const daysDiff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff < 7) {
      return format(date, 'EEEE');
    }
    
    // Otherwise show the date (e.g., "Apr 12")
    return format(date, 'MMM d');
  } catch (error) {
    return '';
  }
};
