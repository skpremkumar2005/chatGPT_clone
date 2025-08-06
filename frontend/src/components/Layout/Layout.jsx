import React from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from './Header';

const Layout = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {sidebarOpen && <Sidebar />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet /> {/* Renders the active child route, e.g., ChatContainer */}
        </main>
      </div>
    </div>
  );
};

export default Layout;