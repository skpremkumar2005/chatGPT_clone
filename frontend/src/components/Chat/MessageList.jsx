import { useEffect, useRef, memo } from "react";
import Message from "./Message";

const MessageList = memo(({ messages, isTyping }) => {
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-black scroll-smooth">
      {messages && messages.length > 0 ? (
        <div>
          {messages.map((msg, index) => (
            <Message key={msg._id || `msg-${index}`} message={msg} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-center px-6">
          <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-zinc-400 dark:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">No messages yet</p>
          <p className="text-xs text-zinc-400 dark:text-zinc-600">Start the conversation below</p>
        </div>
      )}

      {isTyping && (
        <div className="w-full bg-zinc-50 dark:bg-zinc-950/40">
          <div className="max-w-3xl mx-auto px-6 py-5">
            <p className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-3">Answer</p>
            <div className="flex gap-1">
              {[0, 120, 240].map((delay) => (
                <div
                  key={delay}
                  className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
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
