import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Home,
  Server,
  Folder,
  MessageSquare,
  Image,
  Settings,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Sites', href: '/sites', icon: Server },
  { name: 'Forums', href: '/forums', icon: Folder },
  { name: 'Threads', href: '/threads', icon: MessageSquare },
  { name: 'Media', href: '/media', icon: Image },
  { name: 'Recent Activity', href: '/activity', icon: Clock },
  { name: 'Settings', href: '/settings', icon: Settings },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

export function Sidebar({ isCollapsed: controlledCollapsed, onToggle }: SidebarProps) {
  const router = useRouter();
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Use controlled state if provided, otherwise use internal state
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  
  const setIsCollapsed = (value: boolean) => {
    if (onToggle) {
      onToggle(value);
    } else {
      setInternalCollapsed(value);
    }
  };

  // Ensure component is mounted before using router (prevents hydration mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => {
    if (!mounted || !router.pathname) return false;
    if (href === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(href);
  };

  return (
    <aside
      className={`fixed left-4 top-4 bottom-4 border-r border-white/10 transition-all duration-300 z-50 ${
        isCollapsed ? 'w-20' : 'w-64'
      } glass-card`}
      style={{ 
        borderRadius: '0.75rem 0 0 0.75rem',
        height: 'calc(100vh - 2rem)'
      }}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
                  <Server className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-white font-semibold text-sm">
                    XenForo
                  </h1>
                  <p className="text-white/60 text-xs">Media Crawler</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all ml-auto"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600/80 to-blue-600/80 text-white shadow-glow'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`${isCollapsed ? 'w-6 h-6' : 'w-5 h-5'} ${
                    active ? 'text-white' : 'text-white/70 group-hover:text-white'
                  } transition-colors`}
                />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <div className="px-4 py-2">
              <p className="text-white/50 text-xs">v0.0.1</p>
              <p className="text-white/40 text-xs mt-1">
                © 2024 XenForo Crawler
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
