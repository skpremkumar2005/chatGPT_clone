import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loadUser } from './redux/slices/authSlice';

// --- CHECK THESE IMPORTS CAREFULLY ---
// These should all be default imports (no curly braces)
import Layout from './components/Layout/Layout';
import ChatContainer from './components/Chat/ChatContainer';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register'; // Likely source of the issue
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ChatContainer />} />
          <Route path="chat/:chatId" element={<ChatContainer />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;