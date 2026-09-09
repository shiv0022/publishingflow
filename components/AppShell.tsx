'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="saas-layout">
      {/* Left Sidebar Menu */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area with TopBar */}
      <div className="saas-main-wrapper">
        <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
        <main className="saas-content-area">
          {children}
        </main>
      </div>
    </div>
  );
}
