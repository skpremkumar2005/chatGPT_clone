import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../Sidebar/Sidebar";

const Layout = () => {
  return (
    <div className="relative h-screen flex bg-black text-white overflow-hidden">
      {/* Sidebar - Always visible vertical sidebar */}
      <Sidebar />

      {/* Main Content - No header */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
