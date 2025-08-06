import React from 'react';
import { useChat } from '../../hooks/useChat';
import { PlusIcon } from '@heroicons/react/24/solid'; // You'll need to install heroicons: npm install @heroicons/react

const NewChatButton = () => {
  const { createNewChat } = useChat();

  return (
    <button
      onClick={createNewChat}
      className="flex items-center justify-center w-full px-4 py-2 mb-4 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors duration-200"
    >
      <PlusIcon className="h-5 w-5 mr-2" />
      New Chat
    </button>
  );
};

export default NewChatButton;