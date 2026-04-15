import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { logoutUser } from "../../redux/slices/authSlice";
import { useChat } from "../../hooks/useChat";
import { toggleSidebar } from "../../redux/slices/uiSlice";
import ChatHistory from "./ChatHistory";
import ProfileSettings from "../Profile/ProfileSettings";
import ThemeToggle from "../UI/ThemeToggle";
import {
  PlusIcon,
  ClockIcon,
  Cog6ToothIcon,
  PowerIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

const Sidebar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, permissions } = useSelector((state) => state.auth);
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { chatHistory, isLoading, createNewChat } = useChat();
  const [showProfile, setShowProfile] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const hasAdminAccess = permissions?.some((p) =>
    ["manage:companies", "view:users", "view:activity_logs", "view:analytics", "manage:company_settings"].includes(p),
  );

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const handleNewChat = () => {
    createNewChat();
    navigate("/");
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/" || location.pathname.startsWith("/chat");
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { icon: HomeIcon, label: "Home", path: "/", action: () => navigate("/") },
    { icon: PlusIcon, label: "New", path: null, action: handleNewChat, highlight: true },
    { icon: ClockIcon, label: "History", path: null, action: () => dispatch(toggleSidebar()), active: sidebarOpen },
    ...(hasAdminAccess
      ? [
          { icon: DocumentTextIcon, label: "KB", path: "/admin/knowledge-base", action: () => navigate("/admin/knowledge-base") },
          { icon: ShieldCheckIcon, label: "Admin", path: "/admin", action: () => navigate("/admin") },
        ]
      : []),
  ];

  return (
    <>
      {/* Vertical Icon Sidebar */}
      <aside className="w-[68px] bg-white dark:bg-zinc-950 flex flex-col border-r border-zinc-100 dark:border-zinc-800/60 z-50 flex-shrink-0">

        {/* Logo */}
        <div className="h-[60px] flex items-center justify-center border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-cyan-500/20">
            <span className="text-white text-xs font-bold tracking-tight">EA</span>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 flex flex-col items-center py-3 gap-1">
          {navItems.map((item, index) => {
            const active = item.active ?? (item.path ? isActive(item.path) : false);
            return (
              <button
                key={index}
                onClick={item.action}
                title={item.label}
                className={`relative w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all group ${
                  item.highlight
                    ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-md shadow-cyan-500/30"
                    : active
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                    : "text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <item.icon className="w-5 h-5" />
              </button>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="flex flex-col items-center gap-1 pb-3 border-t border-zinc-100 dark:border-zinc-800/60 pt-3">
          <ThemeToggle compact />

          <button
            onClick={() => setShowProfile(true)}
            title="Settings"
            className="w-12 h-12 flex items-center justify-center rounded-xl text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 hover:text-zinc-700 dark:hover:text-zinc-200 transition-all"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* User Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              title={user?.name}
              className="w-12 h-12 flex items-center justify-center rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-all"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute bottom-full left-14 mb-2 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                  <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">{user?.name || "User"}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{user?.email || ""}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => { setShowProfile(true); setShowUserMenu(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                    >
                      <Cog6ToothIcon className="w-4 h-4 text-zinc-400" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors"
                    >
                      <PowerIcon className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </aside>

      {/* Expandable History Panel */}
      {sidebarOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40" onClick={() => dispatch(toggleSidebar())} />
          <aside className="w-64 bg-white dark:bg-zinc-950 flex flex-col border-r border-zinc-100 dark:border-zinc-800/60 fixed inset-y-0 left-[68px] z-50 shadow-2xl">
            <div className="flex items-center justify-between px-4 h-[60px] border-b border-zinc-100 dark:border-zinc-800/60 flex-shrink-0">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Chat History</h2>
              <button
                onClick={() => dispatch(toggleSidebar())}
                className="w-7 h-7 flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-lg transition-colors"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 py-2">
              <ChatHistory history={chatHistory} loading={isLoading} />
            </div>
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800/60">
              <button
                onClick={handleNewChat}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-cyan-500/20"
              >
                <PlusIcon className="w-4 h-4" />
                New Chat
              </button>
            </div>
          </aside>
        </>
      )}

      {showProfile && <ProfileSettings onClose={() => setShowProfile(false)} />}
    </>
  );
};

export default Sidebar;
