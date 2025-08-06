import React from 'react';
import { useChat } from '../../hooks/useChat';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatContainer = () => {
  const {
    currentChat,
    isLoading,
    isTyping,
    sendMessage,
    activeChatId,
  } = useChat();

  if (!activeChatId) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Select a chat or start a new one.</p>
      </div>
    );
  }
  
  if (isLoading && !currentChat.messages.length) {
      return (
          <div className="flex items-center justify-center h-full text-gray-400">
              <p>Loading messages...</p>
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full bg-gray-900">
      <MessageList messages={currentChat.messages} isTyping={isTyping} />
      <MessageInput onSend={sendMessage} disabled={isTyping} />
    </div>
  );
};

export default ChatContainer;