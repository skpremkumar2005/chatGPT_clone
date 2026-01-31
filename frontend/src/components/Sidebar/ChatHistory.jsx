import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { updateChatTitle, deleteChat } from "../../redux/slices/chatSlice";
import {
  ChatBubbleLeftIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const ChatHistory = ({ history, loading }) => {
  const { chatId } = useParams();
  const dispatch = useDispatch();
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const handleEditStart = (chat) => {
    setEditingChatId(chat.id);
    setEditTitle(chat.title);
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
    setEditTitle("");
  };

  const handleEditSave = async (chatId) => {
    if (editTitle.trim()) {
      await dispatch(updateChatTitle({ chatId, title: editTitle }));
      setEditingChatId(null);
      setEditTitle("");
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await dispatch(deleteChat(chatId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <ul className="space-y-0.5">
        {history?.map((chat) => (
          <li key={chat.id}>
            {editingChatId === chat.id ? (
              <div className="flex items-center gap-1 px-2 py-1">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 px-2 py-1 text-xs bg-zinc-900 text-white rounded border border-zinc-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleEditSave(chat.id);
                    if (e.key === "Escape") handleEditCancel();
                  }}
                  autoFocus
                />
                <button
                  onClick={() => handleEditSave(chat.id)}
                  className="text-green-400 hover:text-green-300 text-xs px-1"
                >
                  ✓
                </button>
                <button
                  onClick={handleEditCancel}
                  className="text-red-400 hover:text-red-300 text-xs px-1"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="group relative">
                <Link
                  to={`/chat/${chat.id}`}
                  className={`flex items-center gap-2 px-2 py-2 rounded-md transition-colors ${
                    chat.id === chatId
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <ChatBubbleLeftIcon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-xs truncate">
                    {chat.title || "New Chat"}
                  </span>
                </Link>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-0.5 bg-black rounded p-0.5 transition-opacity">
                  <button
                    onClick={() => handleEditStart(chat)}
                    className="p-1 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-900 rounded transition-colors"
                    title="Rename"
                  >
                    <PencilIcon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-900 rounded transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="w-3 h-3" />
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
