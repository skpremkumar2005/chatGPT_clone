import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { Bars3Icon } from '@heroicons/react/24/solid'; // You may need to run: npm install @heroicons/react

const Header = () => {
  const { currentChat } = useSelector((state) => state.chat);
  const dispatch = useDispatch();

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <header className="flex items-center bg-gray-800 text-white p-4 border-b border-gray-700">
      {/* --- THIS IS THE NEW HAMBURGER BUTTON --- */}
      {/* Tailwind classes hide it on medium screens and up (md:hidden) */}
      <button
        onClick={handleToggleSidebar}
        className="mr-4 p-1 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-white md:hidden"
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
      {/* --- END OF NEW BUTTON --- */}

      <h1 className="text-xl font-semibold truncate">
        {currentChat?.title || "ChatGPT Clone"}
      </h1>
    </header>
  );
};

export default Header;