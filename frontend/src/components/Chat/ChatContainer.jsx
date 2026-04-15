import { useState } from "react";
import { useDispatch } from "react-redux";
import { useChat } from "../../hooks/useChat";
import { getMessages } from "../../redux/slices/chatSlice";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import DocumentUpload from "./DocumentUpload";
import WelcomeScreen from "./WelcomeScreen";

const ChatContainer = () => {
  const dispatch = useDispatch();
  const { currentChat, isLoading, isTyping, sendMessage, activeChatId } =
    useChat();
  const [showUpload, setShowUpload] = useState(false);

  const handleDocumentProcessed = (_data) => {
    setShowUpload(false);
    // Re-fetch messages so the upload + AI reply appear immediately
    if (activeChatId) {
      dispatch(getMessages(activeChatId));
    }
  };

  if (!activeChatId) {
    return <WelcomeScreen />;
  }

  if (isLoading && !currentChat.messages.length) {
    return (
      <div className="flex items-center justify-center h-full bg-white dark:bg-black text-zinc-400">
        <div className="flex gap-1">
          {[0, 120, 240].map((d) => (
            <div key={d} className="w-2 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      <MessageList messages={currentChat.messages} isTyping={isTyping} />
      {showUpload ? (
        <DocumentUpload
          chatId={activeChatId}
          onDocumentProcessed={handleDocumentProcessed}
          onCancel={() => setShowUpload(false)}
        />
      ) : (
        <MessageInput
          onSend={sendMessage}
          disabled={isTyping}
          onAttachClick={() => setShowUpload(true)}
        />
      )}
    </div>
  );
};

export default ChatContainer;
