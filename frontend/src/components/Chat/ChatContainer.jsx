import React, { useState } from "react";
import { useChat } from "../../hooks/useChat";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import DocumentUpload from "./DocumentUpload";
import WelcomeScreen from "./WelcomeScreen";

const ChatContainer = () => {
  const { currentChat, isLoading, isTyping, sendMessage, activeChatId } =
    useChat();

  const [showDocumentUpload, setShowDocumentUpload] = useState(false);

  const handleDocumentProcessed = (data) => {
    // Refresh messages or handle the processed document
    setShowDocumentUpload(false);
    // The backend automatically adds messages, so we just close the upload UI
    window.location.reload(); // Simple refresh - can be optimized
  };

  if (!activeChatId) {
    return <WelcomeScreen />;
  }

  if (isLoading && !currentChat.messages.length) {
    return (
      <div className="flex items-center justify-center h-full bg-black text-zinc-600">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black">
      <MessageList messages={currentChat.messages} isTyping={isTyping} />
      {showDocumentUpload ? (
        <DocumentUpload
          chatId={activeChatId}
          onDocumentProcessed={handleDocumentProcessed}
          onCancel={() => setShowDocumentUpload(false)}
        />
      ) : (
        <MessageInput
          onSend={sendMessage}
          disabled={isTyping}
          onDocumentClick={() => setShowDocumentUpload(true)}
        />
      )}
    </div>
  );
};

export default ChatContainer;
