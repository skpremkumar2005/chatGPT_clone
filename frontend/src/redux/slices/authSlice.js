import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '../../services/authAPI';

// --- Thunks ---

// --- FIX: ADD THIS THUNK BACK IN ---
export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData);
    return response.data; // Return the success response
  } catch (error) {
    return rejectWithValue(error.response ? error.response.data : { message: error.message });
  }
});

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    await authAPI.login(credentials);
  } catch (error) {
    return rejectWithValue(error.response ? error.response.data : { message: error.message });
  }
});

export const loadUser = createAsyncThunk('auth/loadUser', async (_, { rejectWithValue }) => {
    try {
        const response = await authAPI.getCurrentUser();
        return { user: response.data.data };
    } catch (error) {
        return rejectWithValue(error.response ? error.response.data : { message: error.message });
    }
});

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
    try {
        await authAPI.logout();
    } catch (error) {
        return rejectWithValue(error.response ? error.response.data : { message: error.message });
    }
});


// --- Slice Definition ---

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: false, // Set to false initially, true only during async calls
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- FIX: ADD REDUCERS FOR registerUser ---
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : action.error.message;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state) => {
        state.loading = false;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ? action.payload.message : action.error.message;
        state.isAuthenticated = false;
      })
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
      })
      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;