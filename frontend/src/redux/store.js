import { configureStore } from '@reduxjs/toolkit';
import chatReducer from './slices/chatSlice';
import uiReducer from './slices/uiSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    ui: uiReducer,
  },
});