import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const router = useRouter();

  const navItems = [
    { href: '/', label: 'Sites' },
    { href: '/login', label: 'Login' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b">
        <div className="w-full px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">XenForo Media Crawler</h1>
            <div className="flex gap-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={router.pathname === item.href ? 'default' : 'ghost'}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <main className="w-full px-4 py-8">{children}</main>
    </div>
  );
}

