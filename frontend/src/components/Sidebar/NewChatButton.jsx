import React from "react";
import { useChat } from "../../hooks/useChat";
import { PlusIcon } from "@heroicons/react/24/outline";

const NewChatButton = () => {
  const { createNewChat } = useChat();

  return (
    <button
      onClick={createNewChat}
      className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-white text-sm font-medium bg-zinc-900 hover:bg-zinc-800 rounded-md transition-colors border border-zinc-800"
    >
      <PlusIcon className="h-4 w-4" />
      <span>New</span>
    </button>
  );
};

export default NewChatButton;
