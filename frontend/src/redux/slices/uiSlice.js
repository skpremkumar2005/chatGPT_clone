import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Start with the sidebar closed by default, which is better for mobile.
  sidebarOpen: false,
  theme: 'dark',
  isMobile: window.innerWidth < 768,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // This action will flip the boolean value, used by the hamburger button.
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    // This action allows explicitly setting the state, useful for the overlay.
    setSidebarOpen: (state, action) => {
        state.sidebarOpen = action.payload;
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
    },
    setIsMobile: (state, action) => {
        state.isMobile = action.payload;
    }
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme, setIsMobile } = uiSlice.actions;
export default uiSlice.reducer;