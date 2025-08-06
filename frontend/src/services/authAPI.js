import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/auth`;

// A helper to get the auth token from localStorage
const getAuthToken = () => localStorage.getItem('token');

// Create an Axios instance with default headers
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // --- ADD THIS LINE ---
  withCredentials: true, // This tells axios to send cookies with requests
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- API Functions ---
export const register = (userData) => {
  return api.post('/register', userData);
};

export const login = (credentials) => {
  return api.post('/login', credentials);
};

export const getCurrentUser = () => {
  return api.get('/me');
};

// Logout now MUST call the backend to clear the cookie
export const logout = () => {
  return api.post('/logout');
};

const authAPI = {
  register,
  login,
  getCurrentUser,
  logout,
};

export default authAPI;