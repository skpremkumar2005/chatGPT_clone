import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSidebar } from '../../redux/slices/uiSlice';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import Header from './Header';

const Layout = () => {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const dispatch = useDispatch();

  return (
    // Add `relative` to the parent container for proper z-index context
    <div className="relative h-screen flex bg-gray-900 text-white overflow-hidden">
      {/* --- The Sidebar is now always in the DOM --- */}
      {/* Its own CSS classes will hide/show it */}
      <Sidebar />

      {/* --- ADD THIS CLICKABLE OVERLAY --- */}
      {/* It only appears on mobile when the sidebar is open */}
      {sidebarOpen && (
        <div
          onClick={() => dispatch(toggleSidebar())}
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          aria-hidden="true"
        ></div>
      )}
      {/* --- END OF OVERLAY --- */}


      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;