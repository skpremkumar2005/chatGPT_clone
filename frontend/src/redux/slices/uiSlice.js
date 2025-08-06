import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  theme: 'dark', // 'light' or 'dark'
  isMobile: window.innerWidth < 768,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setIsMobile: (state, action) => {
        state.isMobile = action.payload;
    }
  },
});

export const { toggleSidebar, setTheme, setIsMobile } = uiSlice.actions;
export default uiSlice.reducer;