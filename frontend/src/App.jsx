import React, { useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loadUser } from "./redux/slices/authSlice";
import { Toaster } from "react-hot-toast";
import useTheme from "./hooks/useTheme";

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
import KnowledgeBase from "./components/Admin/KnowledgeBase";
import Analytics from "./components/Admin/Analytics";
import Roles from "./components/Admin/Roles";
import Settings from "./components/Admin/Settings";
import FileManager from "./components/Admin/FileManager";

const ThemedToaster = () => {
  const { isDark } = useTheme();
  return (
    <Toaster
      toastOptions={{
        style: isDark
          ? { background: "#18181b", color: "#fff", border: "1px solid #27272a" }
          : { background: "#fff", color: "#18181b", border: "1px solid #e4e4e7" },
        success: { iconTheme: { primary: "#06b6d4", secondary: isDark ? "#fff" : "#18181b" } },
        error: { iconTheme: { primary: "#ef4444", secondary: isDark ? "#fff" : "#18181b" } },
      }}
    />
  );
};

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  return (
    <>
      <ThemedToaster />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDefaultRoute />} />
            <Route path="companies" element={<RequirePermission permission="manage:companies"><Companies /></RequirePermission>} />
            <Route path="users" element={<RequirePermission permission="view:users"><UserManagement /></RequirePermission>} />
            <Route path="logs" element={<RequirePermission permission="view:activity_logs"><ActivityLogs /></RequirePermission>} />
            <Route path="analytics" element={<RequirePermission permission="view:analytics"><Analytics /></RequirePermission>} />
            <Route path="roles" element={<RequirePermission permission="view:roles"><Roles /></RequirePermission>} />
            <Route path="settings" element={<RequirePermission permission="manage:company_settings"><Settings /></RequirePermission>} />
            <Route path="knowledge-base" element={<RequirePermission permission="upload:documents"><KnowledgeBase /></RequirePermission>} />
            <Route path="files" element={<RequirePermission permission="upload:documents"><FileManager /></RequirePermission>} />
          </Route>

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
