import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((state) => state.auth);
  const location = useLocation();

  // On initial load, `loading` will be true. This block will run.
  if (loading) {
    // It will wait here until the loadUser API call finishes.
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        Loading...
      </div>
    );
  }

  // After loading is false, this check will run.
  if (!isAuthenticated) {
    // If the API call failed, isAuthenticated is false, and it will correctly redirect.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If loading is false AND isAuthenticated is true, it shows the chat page.
  return children;
};

export default ProtectedRoute;