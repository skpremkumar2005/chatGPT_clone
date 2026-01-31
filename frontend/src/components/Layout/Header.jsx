import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../redux/slices/uiSlice";
import { Bars3Icon, Cog6ToothIcon } from "@heroicons/react/24/outline";
import ProfileSettings from "../Profile/ProfileSettings";

const Header = () => {
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleToggleSidebar = () => {
    dispatch(toggleSidebar());
  };

  return (
    <>
      <header className="h-12 flex items-center justify-between bg-black text-white px-3 border-b border-zinc-800 sticky top-0 z-30">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle */}
          <button
            onClick={handleToggleSidebar}
            className={`p-1.5 rounded-md transition-all ${
              sidebarOpen
                ? "bg-zinc-900 text-cyan-400"
                : "hover:bg-zinc-900 text-zinc-400"
            }`}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Logo - Simple Text */}
          <div className="flex items-center gap-2 ml-1">
            <span className="text-sm font-medium text-white">
              Enterprise AI
            </span>
            <span className="hidden sm:block text-xs text-zinc-500 border-l border-zinc-800 pl-2">
              Gemini 2.0
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1">
          {/* Settings Button */}
          <button
            onClick={() => setShowProfile(true)}
            className="p-1.5 hover:bg-zinc-900 rounded-md transition-colors"
            aria-label="Settings"
          >
            <Cog6ToothIcon className="w-5 h-5 text-zinc-400 hover:text-zinc-300" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="p-1 hover:bg-zinc-900 rounded-md transition-colors"
              aria-label="User menu"
            >
              <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-52 bg-zinc-900 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-zinc-800">
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
                      onClick={() => {
                        localStorage.removeItem("token");
                        window.location.href = "/login";
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Profile Settings Modal */}
      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Header;
