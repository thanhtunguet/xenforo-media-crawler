import React from 'react';
import { useRouter } from 'next/router';
import { ChevronRight, Moon, Sun } from 'lucide-react';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const router = useRouter();
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    const pathSegments = router.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ name: 'Home', href: '/' }];

    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const name = segment
        .replace(/\[|\]/g, '')
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      breadcrumbs.push({ name, href });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Get page title from breadcrumbs or prop
  const pageTitle = title || breadcrumbs[breadcrumbs.length - 1]?.name || 'Dashboard';

  return (
    <div className="glass-card border-b border-white/10 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{pageTitle}</h1>

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 mt-1">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.href}>
                {index > 0 && (
                  <ChevronRight className="w-4 h-4 text-white/40" />
                )}
                <button
                  onClick={() => router.push(crumb.href)}
                  className={`text-sm transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'text-indigo-400 font-medium'
                      : 'text-white/60 hover:text-white/80'
                  }`}
                >
                  {crumb.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white transition-all"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* User Avatar Placeholder */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center">
            <span className="text-white font-semibold text-sm">A</span>
          </div>
        </div>
      </div>
    </div>
  );
}
