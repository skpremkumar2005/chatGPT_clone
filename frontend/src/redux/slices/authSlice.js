import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authAPI from "../../services/authAPI";

// --- Thunks ---
export const registerUser = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : { message: error.message },
      );
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data.data; // Return user, company, role data
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : { message: error.message },
      );
    }
  },
);

export const loadUser = createAsyncThunk(
  "auth/loadUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return { user: response.data.data };
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : { message: error.message },
      );
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (error) {
      return rejectWithValue(
        error.response ? error.response.data : { message: error.message },
      );
    }
  },
);

// --- Slice Definition ---

const initialState = {
  user: null,
  company_id: null,
  company_name: null,
  role_name: null,
  permissions: [],
  isAuthenticated: false,
  loading: true,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.company_id = null;
      state.company_name = null;
      state.role_name = null;
      state.permissions = [];
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
        state.error = action.payload
          ? action.payload.message
          : action.error.message;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.company_id = action.payload.company;
        state.role_name = action.payload.role;
        state.permissions = action.payload.user?.permissions || [];
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload
          ? action.payload.message
          : action.error.message;
        state.isAuthenticated = false;
      })
      // Load User (This runs on initial app load)
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.company_id = action.payload.user?.company_id;
        state.role_name = action.payload.user?.role_name;
        state.permissions = action.payload.user?.permissions || [];
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.company_id = null;
        state.role_name = null;
        state.permissions = [];
      })
      // Logout User
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.company_id = null;
        state.role_name = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.loading = false;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.user = null;
        state.company_id = null;
        state.role_name = null;
        state.permissions = [];
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
