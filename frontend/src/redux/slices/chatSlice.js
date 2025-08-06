import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import chatAPI from '../../services/chatAPI';

// --- ASYNC THUNKS ---

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (_, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getChats();
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const createChat = createAsyncThunk(
  'chat/createChat',
  async ({ title }, { dispatch, rejectWithValue }) => {
    try {
      const response = await chatAPI.createChat(title);
      dispatch(fetchChatHistory());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async (chatId, { rejectWithValue }) => {
    try {
      const response = await chatAPI.getMessages(chatId);
      return { messages: response.data.data, chatId };
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

// --- THIS THUNK IS MODIFIED ---
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ chatId, content }, { dispatch, rejectWithValue }) => {
    try {
      const response = await chatAPI.sendMessage(chatId, content);
      
      // After successfully sending a message, refresh the chat history
      // to pick up any potential title changes from the backend.
      dispatch(fetchChatHistory());

      return response.data.data; // Return the AI's response
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const updateChatTitle = createAsyncThunk(
  'chat/updateChatTitle',
  async ({ chatId, title }, { rejectWithValue }) => {
    try {
      const response = await chatAPI.updateChatTitle(chatId, title);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);

export const deleteChat = createAsyncThunk(
  'chat/deleteChat',
  async (chatId, { rejectWithValue }) => {
    try {
      await chatAPI.deleteChat(chatId);
      return chatId; // Return the ID for filtering state
    } catch (error) {
      return rejectWithValue(error.response ? error.response.data : error.message);
    }
  }
);


const initialState = {
  currentChat: { id: null, title: '', messages: [] },
  chatHistory: [],
  loading: false,
  isTyping: false,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentChat: (state, action) => {
      state.currentChat = action.payload;
    },
    addMessageOptimistically: (state, action) => {
      if (!Array.isArray(state.currentChat.messages)) {
        state.currentChat.messages = [];
      }
      state.currentChat.messages.push(action.payload);
      state.isTyping = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch History
      .addCase(fetchChatHistory.pending, (state) => { state.loading = true; })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.chatHistory = action.payload || [];
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : action.error.message;
      })
      // Get Messages
      .addCase(getMessages.pending, (state) => { state.loading = true; })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChat.id = action.payload.chatId;
        state.currentChat.messages = action.payload.messages || [];
      })
      .addCase(getMessages.rejected, (state, action) => {
          state.loading = false;
          state.error = action.payload ? action.payload.message : action.error.message;
          state.currentChat.messages = [];
      })
      // Send Message
      .addCase(sendMessage.pending, (state) => { state.isTyping = true; state.error = null; })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        state.currentChat.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.payload ? action.payload.message : action.error.message;
      })
      // Delete Chat
      .addCase(deleteChat.fulfilled, (state, action) => {
        state.chatHistory = state.chatHistory.filter(chat => chat.id !== action.payload);
        if (state.currentChat.id === action.payload) {
          state.currentChat = { id: null, title: '', messages: [] };
        }
      })
      .addCase(deleteChat.rejected, (state, action) => {
        state.error = action.payload ? action.payload.message : action.error.message;
      });
  },
});

export const { setCurrentChat, addMessageOptimistically } = chatSlice.actions;

export default chatSlice.reducer;