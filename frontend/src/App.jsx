import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
 
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadUser } from "./redux/slices/authSlice";
import { Toaster } from "react-hot-toast";

import Layout from "./components/Layout/Layout";
import ChatContainer from "./components/Chat/ChatContainer";
import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import RequirePermission from "./components/Auth/RequirePermission";
import AdminLayout from "./components/Admin/AdminLayout";
import UserManagement from "./components/Admin/UserManagement";
import ActivityLogs from "./components/Admin/ActivityLogs";
import Companies from "./components/Admin/Companies";
import AdminDefaultRoute from "./components/Admin/AdminDefaultRoute";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <Toaster
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #27272a",
          },
          success: {
            iconTheme: {
              primary: "#06b6d4",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Admin Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDefaultRoute />} />
            <Route
              path="companies"
              element={
                <RequirePermission permission="manage:companies">
                  <Companies />
                </RequirePermission>
              }
            />
            <Route
              path="users"
              element={
                <RequirePermission permission="view:users">
                  <UserManagement />
                </RequirePermission>
              }
            />
            <Route
              path="logs"
              element={
                <RequirePermission permission="view:activity_logs">
                  <ActivityLogs />
                </RequirePermission>
              }
            />
            <Route
              path="analytics"
              element={
                <RequirePermission permission="view:analytics">
                  <div className="p-8 text-white">Analytics (Coming Soon)</div>
                </RequirePermission>
              }
            />
            <Route
              path="roles"
              element={
                <RequirePermission permission="view:roles">
                  <div className="p-8 text-white">Roles (Coming Soon)</div>
                </RequirePermission>
              }
            />
            <Route
              path="settings"
              element={
                <RequirePermission permission="manage:company_settings">
                  <div className="p-8 text-white">Settings (Coming Soon)</div>
                </RequirePermission>
              }
            />
          </Route>

          {/* Protected Chat Routes */}
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
    </>
  );
}

export default App;
