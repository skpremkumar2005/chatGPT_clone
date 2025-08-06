import React from 'react';
import { UserIcon, SparklesIcon } from '@heroicons/react/24/solid';
import { formatTimestamp } from '../../utils/helpers'; // Import the helper

const Message = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start p-4 ${isUser ? 'bg-gray-800' : 'bg-gray-700'}`}>
      <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-500' : 'bg-green-500'}`}>
        {isUser ? <UserIcon className="h-5 w-5 text-white" /> : <SparklesIcon className="h-5 w-5 text-white" />}
      </div>
      <div className="ml-4 w-full">
        <p className="whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs text-gray-500 mt-1 block">
          {formatTimestamp(message.timestamp)} {/* Use the helper here */}
        </span>
      </div>
    </div>
  );
};

export default Message;