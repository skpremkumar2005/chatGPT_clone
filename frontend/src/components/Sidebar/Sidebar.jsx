import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../redux/slices/authSlice";
import { useChat } from "../../hooks/useChat";
import { toggleSidebar } from "../../redux/slices/uiSlice";
import ChatHistory from "./ChatHistory";
import ProfileSettings from "../Profile/ProfileSettings";
import {
  Squares2X2Icon,
  PlusIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, permissions } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { chatHistory, isLoading, createNewChat } = useChat();
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const hasAdminAccess = permissions?.some((p) =>
    [
      "manage:companies",
      "view:users",
      "view:activity_logs",
      "view:analytics",
      "manage:company_settings",
    ].includes(p),
  );

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleCloseSidebar = () => {
    dispatch(toggleSidebar());
  };

  const handleNewChat = () => {
    createNewChat();
    navigate("/");
  };

  const navItems = [
    { icon: Squares2X2Icon, label: "Home", action: () => navigate("/") },
    { icon: PlusIcon, label: "New", action: handleNewChat },
    {
      icon: ClockIcon,
      label: "History",
      action: () => dispatch(toggleSidebar()),
    },
    // Only show Admin Panel for users with admin permissions
    ...(hasAdminAccess
      ? [
          {
            icon: ShieldCheckIcon,
            label: "Admin",
            action: () => navigate("/admin"),
          },
        ]
      : []),
    // { icon: MagnifyingGlassIcon, label: "Discover", action: () => {} },
    // { icon: ChartBarIcon, label: "Spaces", action: () => {} },
    // { icon: EllipsisHorizontalIcon, label: "More", action: () => {} },
  ];

  return (
    <>
      {/* Vertical Icon Sidebar - Always visible */}
      <aside className="w-16 bg-black text-white flex flex-col border-r border-zinc-800 z-50">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-zinc-800">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">EA</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4">
          <div className="space-y-1">
            {navItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex flex-col items-center justify-center py-3 px-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors group relative"
                title={item.label}
              >
                <item.icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Settings & User */}
        <div className="border-t border-zinc-800">
          <button
            onClick={() => setShowProfile(true)}
            className="w-full flex flex-col items-center justify-center py-3 px-2 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-medium">Settings</span>
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center justify-center py-3 px-2 hover:bg-zinc-900 transition-colors"
              title={user?.name}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute bottom-full left-16 mb-2 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-3 border-b border-zinc-800">
                    <p className="text-sm font-medium text-white truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowProfile(true);
                        setShowUserMenu(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                    >
                      <Cog6ToothIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Expandable History Sidebar */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={handleCloseSidebar}
          />

          {/* History Sidebar */}
          <aside className="w-64 bg-black text-white flex flex-col border-r border-zinc-800 fixed inset-y-0 left-16 z-50">
            <div className="flex items-center justify-between px-3 py-4 border-b border-zinc-800">
              <h2 className="text-sm font-semibold text-white">History</h2>
              <button
                onClick={handleCloseSidebar}
                className="p-1 hover:bg-zinc-900 rounded-md text-zinc-400 hover:text-white text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2">
              <ChatHistory history={chatHistory} loading={isLoading} />
            </div>
          </aside>
        </>
      )}

      {/* Profile Settings Modal */}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Sidebar;
