import React from 'react';
import { Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col">
      {/* Main full-width content area (No top header bar, no sidebar) */}
      <main className="flex-grow p-6 overflow-x-hidden w-full max-w-[1600px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
