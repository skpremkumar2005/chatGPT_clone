import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { updateChatTitle, deleteChat } from '../../redux/slices/chatSlice';

const ChatHistory = ({ history, loading }) => {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  const handleEditStart = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditTitle('');
  };

  const handleEditSave = async (chatId) => {
    if (editTitle.trim()) {
      await dispatch(updateChatTitle({ chatId, title: editTitle }));
      setEditingChatId(null);
      setEditTitle('');
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this chat?')) {
      await dispatch(deleteChat(chatId));
    }
  };

  if (loading) {
    return <div className="text-gray-400">Loading history...</div>;
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2 text-gray-300">Chat History</h2>
      <ul className="space-y-2">
        {history?.map((chat) => (
          <li key={chat.id}>
            {editingChatId === chat.id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm bg-gray-700 text-white rounded"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSave(chat.id);
                    if (e.key === 'Escape') handleEditCancel();
                  }}
                />
                <button
                  onClick={() => handleEditSave(chat.id)}
                  className="text-green-400 hover:text-green-300 text-sm"
                >
                  Save
                </button>
                <button
                  onClick={handleEditCancel}
                  className="text-red-400 hover:text-red-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between group">
                <Link
                  to={`/chat/${chat.id}`}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors duration-150 ${
                    chat.id === chatId
                      ? 'bg-gray-700'
                      : 'hover:bg-gray-700/50'
                  }`}
                >
                  {chat.title}
                </Link>
                <div className="opacity-0 group-hover:opacity-100 flex space-x-1">
                  <button
                    onClick={() => handleEditStart(chat)}
                    className="text-gray-400 hover:text-white text-sm px-1"
                    title="Edit title"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="text-red-400 hover:text-red-300 text-sm px-1"
                    title="Delete chat"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ChatHistory;
