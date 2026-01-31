import React, { useEffect, useRef, memo } from "react";
import Message from "./Message";

const MessageList = memo(({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-black">
      <div className="space-y-0">
        {messages?.map((msg, index) => (
          <Message key={msg._id || `msg-${index}`} message={msg} />
        ))}
      </div>

      {isTyping && (
        <div className="w-full bg-zinc-950/50">
          <div className="max-w-3xl mx-auto px-6 py-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Answer
                </span>
              </div>

              <div className="flex gap-1.5">
                <div
                  className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
});

MessageList.displayName = "MessageList";

export default MessageList;
