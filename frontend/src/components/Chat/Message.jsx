import React from "react";
import { formatTimestamp } from "../../utils/helpers";

const Message = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <div className={`w-full ${isUser ? "bg-black" : "bg-zinc-950/50"}`}>
      <div className="max-w-3xl mx-auto px-6 py-6">
        <div className="space-y-3">
          {/* Label - Minimal */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              {isUser ? "You" : "Answer"}
            </span>
            {message.response_time && (
              <span className="text-xs text-zinc-600">
                • {message.response_time.toFixed(1)}s
              </span>
            )}
          </div>

          {/* Message Content - Clean */}
          <div className="prose prose-invert max-w-none">
            <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">
              {message.content}
            </p>
          </div>

          {/* Timestamp - Subtle */}
          <div className="text-xs text-zinc-600 pt-1">
            {formatTimestamp(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Message;
