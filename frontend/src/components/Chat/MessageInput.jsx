import React, { useState } from "react";
import {
  PaperAirplaneIcon,
  DocumentArrowUpIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  FolderIcon,
  MicrophoneIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const MessageInput = ({ onSend, disabled, onDocumentClick }) => {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full px-4 py-6 bg-black">
      <div className="max-w-3xl mx-auto">
        {/* Input Container */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg focus-within:border-cyan-500/50 transition-all">
            {/* Search/Focus Icon */}
            <div className="ml-4">
              <MagnifyingGlassIcon className="w-5 h-5 text-zinc-500" />
            </div>

            {/* Text Input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything. Type @ for mentions and / for shortcuts."
              disabled={disabled}
              rows="1"
              className="flex-1 px-4 py-3.5 bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none max-h-32 overflow-y-auto text-sm"
              style={{ minHeight: "24px" }}
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-1 mr-2">
              <button
                type="button"
                onClick={onDocumentClick}
                disabled={disabled}
                className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <DocumentArrowUpIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={disabled}
                className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50"
                title="Add image"
              >
                <PhotoIcon className="w-5 h-5" />
              </button>

              <button
                type="button"
                disabled={disabled}
                className="p-2 text-zinc-500 hover:text-cyan-400 hover:bg-zinc-800 rounded-lg transition-all disabled:opacity-50"
                title="Voice input"
              >
                <MicrophoneIcon className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={disabled || !text.trim()}
                className={`ml-1 p-2.5 rounded-lg transition-all ${
                  disabled || !text.trim()
                    ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                    : "bg-cyan-500 text-white hover:bg-cyan-400"
                }`}
                title="Send message"
              >
                <PaperAirplaneIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Mode Buttons - Below Input */}
        <div className="flex items-center justify-center gap-2 mt-3">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors">
            <ChartBarIcon className="w-3.5 h-3.5" />
            <span>Analyze</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors">
            <MagnifyingGlassIcon className="w-3.5 h-3.5" />
            <span>Recommend</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors">
            <FolderIcon className="w-3.5 h-3.5" />
            <span>Plan</span>
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md border border-zinc-800 transition-colors">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <span>Learn</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessageInput;
