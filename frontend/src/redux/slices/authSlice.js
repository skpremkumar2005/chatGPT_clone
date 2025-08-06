import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authAPI from '../../services/authAPI';

// --- Thunks ---
export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await authAPI.register(userData);
    return response.data;
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
  // --- THIS IS THE FIX ---
  // The app is "loading" its authentication status as soon as it starts.
  loading: true,
  // --- END OF FIX ---
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
      // Register
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
      // Load User (This runs on initial app load)
      .addCase(loadUser.pending, (state) => {
        state.loading = true; // It's already true, but this is for clarity
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false; // Finished loading
        state.isAuthenticated = true; // User is valid
        state.user = action.payload.user;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false; // Finished loading
        state.isAuthenticated = false; // User is not valid
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