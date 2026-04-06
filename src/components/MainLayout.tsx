import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleMenuToggle = useCallback(() => {
    setIsMobileSidebarOpen((prev) => !prev);
  }, []);

  const handleOverlayClose = useCallback(() => {
    setIsMobileSidebarOpen(false);
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-50">
      <Header onMenuToggle={handleMenuToggle} />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar overlay */}
        {isMobileSidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-neutral-900/50 transition-opacity lg:hidden"
            onClick={handleOverlayClose}
            aria-hidden="true"
          />
        )}

        {/* Mobile sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out lg:hidden ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar className="h-full pt-16" />
        </div>

        {/* Desktop sidebar */}
        <Sidebar className="hidden lg:flex" />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default MainLayout;