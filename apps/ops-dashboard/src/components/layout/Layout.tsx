import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppStore } from '../../store/appStore';

export function Layout() {
  const { sidebarCollapsed } = useAppStore();

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div 
        className="flex-1 flex flex-col min-h-screen transition-all duration-300"
        style={{ paddingLeft: sidebarCollapsed ? '64px' : '240px' }}
      >
        {/* Global top bar */}
        <Header />

        {/* Padding and child content wrapper */}
        <main className="flex-grow p-6 pt-24 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
