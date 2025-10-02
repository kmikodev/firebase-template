/**
 * Main layout wrapper with sidebar navigation and mobile bottom nav
 */
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileFloatingNav } from './MobileFloatingNav';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      {/* Main content area with padding for sidebar and bottom nav on mobile */}
      <main className="lg:pl-64 pt-14 lg:pt-0 pb-20 lg:pb-0 overflow-y-auto" style={{
        minHeight: 'calc(100vh - 3.5rem)',
        maxHeight: 'calc(100vh - 3.5rem)'
      }}>
        {children}
      </main>
      {/* Mobile floating bottom navigation */}
      <MobileFloatingNav />
    </div>
  );
}
