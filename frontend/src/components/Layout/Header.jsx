import React from 'react';
import { useSelector } from 'react-redux';

const Header = () => {
  const { currentChat } = useSelector((state) => state.chat);

  return (
    <header className="bg-gray-800 text-white p-4 border-b border-gray-700">
      <h1 className="text-xl font-semibold">
        {currentChat?.title || "ChatGPT Clone"}
      </h1>
    </header>
  );
};

export default Header;