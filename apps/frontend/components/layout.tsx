import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function Layout({ children, title }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen gradient-bg">
      {/* Sidebar */}
      <Sidebar isCollapsed={sidebarCollapsed} onToggle={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-28' : 'ml-72'
        }`}
      >
        {/* Top Bar */}
        <div className="p-4">
          <TopBar title={title} />
        </div>

        {/* Page Content */}
        <main className="p-4 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
