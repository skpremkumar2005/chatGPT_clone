import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../../redux/slices/authSlice";
import ThemeToggle from "../UI/ThemeToggle";
import useTheme from "../../hooks/useTheme";

const AdminLayout = () => {
  const { user, role_name, permissions } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  useTheme();

  const hasPermission = (permission) => permissions?.includes(permission);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  const navItems = [
    {
      name: "Companies", path: "/admin/companies", permission: "manage:companies",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
    },
    {
      name: "Users", path: "/admin/users", permission: "view:users",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
    },
    {
      name: "Activity Logs", path: "/admin/logs", permission: "view:activity_logs",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    },
    {
      name: "Analytics", path: "/admin/analytics", permission: "view:analytics",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    },
    {
      name: "Roles", path: "/admin/roles", permission: "view:roles",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
    },
    {
      name: "Settings", path: "/admin/settings", permission: "manage:company_settings",
      icon: <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </>,
    },
    {
      name: "Knowledge Base", path: "/admin/knowledge-base", permission: "upload:documents",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
    },
    {
      name: "File Manager", path: "/admin/files", permission: "upload:documents",
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />,
    },
  ];

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-black">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">EA</span>
            </div>
            <h1 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Admin Panel</h1>
          </div>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-wider pl-11">Management</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) =>
            hasPermission(item.permission) ? (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-500/20"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white"
                  }`
                }
              >
                <svg className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {item.icon}
                </svg>
                <span>{item.name}</span>
              </NavLink>
            ) : null,
          )}

          <div className="pt-3 mt-2 border-t border-zinc-100 dark:border-zinc-800">
            <NavLink
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white transition-all text-sm font-medium"
            >
              <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span>Back to Chat</span>
            </NavLink>
          </div>
        </nav>

        {/* User Info + Theme */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          {/* Theme toggle */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Appearance</span>
            <ThemeToggle />
          </div>

          {/* User */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow">
              <span className="text-white font-bold text-sm">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-900 dark:text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-zinc-400 dark:text-zinc-500 text-xs truncate">{role_name}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-zinc-100 dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl text-sm font-medium transition-all border border-zinc-200 dark:border-zinc-800 hover:border-red-200 dark:hover:border-zinc-700"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-zinc-50 dark:bg-black">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
