// Default API endpoints (can be overridden by .env)
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
export const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws';

// UI Constants
export const DEFAULT_THEME = 'dark';
export const MOBILE_BREAKPOINT = 768; // in pixels

// Application Constants
export const APP_NAME = 'Gemini Chat';
export const NEW_CHAT_TITLE = 'New Conversation';

// Role constants for messages
export const ROLES = {
  USER: 'user',
  ASSISTANT: 'assistant',
  MODEL: 'model', // The role Gemini API uses for the assistant
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  THEME: 'theme',
};