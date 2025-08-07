import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../../redux/slices/authSlice';
import { useChat } from '../../hooks/useChat';
import NewChatButton from './NewChatButton';
import ChatHistory from './ChatHistory';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui); // Get sidebar state
  const { chatHistory, isLoading } = useChat();

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  // --- THESE CSS CLASSES CONTROL THE RESPONSIVE BEHAVIOR ---
  const sidebarClasses = `
    w-64 bg-gray-800 text-white p-4 flex flex-col border-r border-gray-700
    transform transition-transform duration-300 ease-in-out
    fixed inset-y-0 left-0 h-full z-30 md:relative md:translate-x-0
    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
  `;
  // --- END OF CSS CLASSES ---

  return (
    <aside className={sidebarClasses}>
      <div className="flex-grow overflow-y-auto mb-4">
        <NewChatButton />
        <ChatHistory history={chatHistory} loading={isLoading} />
      </div>

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