import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import chatAPI from '../services/chatAPI'; // <-- 1. IMPORT THE API SERVICE
import {
  fetchChatHistory,
  createChat as createChatAction,
  sendMessage as sendMessageAction,
  getMessages as getMessagesAction,
  setCurrentChat,
  addMessageOptimistically,
} from '../redux/slices/chatSlice';

/**
 * A custom hook to manage all chat-related logic.
 */
export const useChat = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { chatId } = useParams(); // Get chat ID from URL

  // Selectors to get data from the Redux store
  const {
    currentChat,
    chatHistory,
    loading,
    error,
    isTyping,
  } = useSelector((state) => state.chat);

  const { isAuthenticated } = useSelector((state) => state.auth);

  // Effect to fetch chat history when the component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchChatHistory());
    }
  }, [dispatch, isAuthenticated]);


  // --- 2. THIS IS THE MAIN CHANGE - MERGED USEEFFECT HOOK ---
  // This hook now handles both fetching messages for the current chat
  // and cleaning up the previous chat when the URL changes.
  useEffect(() => {
    // This is the ID of the chat we are currently on.
    const currentRouteChatId = chatId;

    // Load messages for the new chat ID, if it exists.
    if (currentRouteChatId) {
      dispatch(getMessagesAction(currentRouteChatId));
    } else {
      // If there's no chat ID (e.g., at the root URL), clear the chat interface.
      dispatch(setCurrentChat({ id: null, title: '', messages: [] }));
    }

    // This return function is the "cleanup" function for the effect.
    // It runs right before this effect runs again (i.e., when the user navigates to a new chat)
    // or when the component unmounts.
    return () => {
      // `currentRouteChatId` holds the ID of the chat we are *leaving*.
      // We check if that chat is empty and should be deleted.
      if (currentRouteChatId) {
        // This is a "fire-and-forget" call. We don't need to wait for it.
        // It will happen in the background.
        chatAPI.cleanupChat(currentRouteChatId);
      }
    };
  }, [chatId, dispatch]); // The effect re-runs whenever the `chatId` in the URL changes.
  // --- END OF MAIN CHANGE ---


  // Function to send a message
  const sendMessage = async (content) => {
    if (!chatId) {
      console.error("Cannot send message without an active chat.");
      return;
    }

    const userMessage = {
      _id: `temp_${Date.now()}`,
      chat_id: chatId,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };
    dispatch(addMessageOptimistically(userMessage));

    dispatch(sendMessageAction({ chatId, content }));
  };

  // Function to create a new chat
  const createNewChat = async () => {
    const resultAction = await dispatch(createChatAction({ title: 'New Chat' }));
    if (createChatAction.fulfilled.match(resultAction)) {
      const newChatId = resultAction.payload.id;
      navigate(`/chat/${newChatId}`);
    }
  };

  // Expose state and functions to the component
  return {
    currentChat,
    chatHistory,
    isLoading: loading,
    isTyping,
    error,
    activeChatId: chatId,
    sendMessage,
    createNewChat,
  };
};