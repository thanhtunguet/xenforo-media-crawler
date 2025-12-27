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
        <div className="pt-4 pr-4">
          <TopBar title={title} />
        </div>

        {/* Page Content */}
        <main className="px-8 pb-8 pr-4 pt-6 animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

