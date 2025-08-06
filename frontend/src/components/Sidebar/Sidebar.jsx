import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, logoutUser } from '../../redux/slices/authSlice';
import { useChat } from '../../hooks/useChat';
import NewChatButton from './NewChatButton';
import ChatHistory from './ChatHistory';

const Sidebar = () => {
  const dispatch = useDispatch();

  // Get user data from the auth slice
  const { user } = useSelector((state) => state.auth);

  // Use our custom hook to get chat data and loading status
  const { chatHistory, isLoading } = useChat();

  // Define the logout handler
  const handleLogout = () => {
    dispatch(logoutUser());
    // The App.js routing will automatically redirect to the /login page
  };

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col border-r border-gray-700">
      {/* --- New Chat Button --- */}
      <NewChatButton />

      {/* --- Chat History List --- */}
      <div className="flex-grow overflow-y-auto mb-4">
        <ChatHistory history={chatHistory} loading={isLoading} />
      </div>


      {/* --- User Profile & Logout Section --- */}
      {/* This section only shows if a user is logged in */}
      {user && (
        <div className="mt-auto pt-4 border-t border-gray-700">
          <div className="font-semibold truncate" title={user.name}>{user.name}</div>
          <div className="text-sm text-gray-400 truncate" title={user.email}>{user.email}</div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 text-left px-3 py-2 rounded-md bg-red-800/50 hover:bg-red-700 transition-colors duration-200"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;