import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";
import useTheme from "../../hooks/useTheme";

const Layout = () => {
  useTheme(); // Applies dark/light class to <html>

  return (
    <div className="relative h-screen flex bg-white dark:bg-black text-zinc-900 dark:text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
