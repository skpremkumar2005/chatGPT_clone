import React, { useEffect, useRef } from 'react';
import Message from './Message';

const MessageList = ({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages?.map((msg, index) => (
        <Message key={msg._id || `msg-${index}`} message={msg} />
      ))}
      {isTyping && (
        <div className="flex items-center justify-center p-4">
          <div className="typing-indicator">
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
            <span className="typing-dot"></span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;