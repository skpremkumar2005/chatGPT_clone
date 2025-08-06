import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  // This line is correct and ensures cookies are sent with every request.
  withCredentials: true,
});

// The old interceptor that reads from localStorage is no longer needed and has been removed.

// --- API Functions ---

export const getChats = () => {
  return api.get('/chats');
};

export const createChat = (title) => {
  return api.post('/chats', { title });
};

export const getMessages = (chatId) => {
  return api.get(`/chats/${chatId}/messages`);
};

export const sendMessage = (chatId, content) => {
  return api.post(`/chats/${chatId}/messages`, { content });
};

export const updateChatTitle = (chatId, title) => {
  return api.put(`/chats/${chatId}`, { title });
};

// This is the function for our auto-delete feature.
export const cleanupChat = (chatId) => {
  return api.post(`/chats/${chatId}/cleanup`);
};

// This function can be used for manual deletion if you add that feature.
export const deleteChat = (chatId) => {
  return api.delete(`/chats/${chatId}`);
};


// --- The final exported object that bundles all functions ---
const chatAPI = {
  getChats,
  createChat,
  getMessages,
  sendMessage,
  updateChatTitle,
  deleteChat,
  cleanupChat, // <-- FIX: Ensure `cleanupChat` is included in the export.
};

export default chatAPI;