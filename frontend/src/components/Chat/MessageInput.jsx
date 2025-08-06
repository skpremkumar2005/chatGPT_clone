import React, { useState } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

const MessageInput = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="p-4 bg-gray-800 border-t border-gray-700">
      <form onSubmit={handleSubmit} className="flex items-center space-x-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled}
          className="flex-1 p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="p-2 bg-blue-600 rounded-full text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors duration-200"
        >
          <PaperAirplaneIcon className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;