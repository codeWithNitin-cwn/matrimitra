'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Clients', href: '/dashboard/clients' },
    { name: 'Profiles', href: '/dashboard/profiles' },
    { name: 'Matches', href: '/dashboard/matches' },
    { name: 'Proposals', href: '/dashboard/proposals' },
    { name: 'Pipeline', href: '/dashboard/pipeline' },
    { name: 'Reports', href: '/dashboard/reports' },
    { name: 'Settings', href: '/dashboard/settings' },
  ];

  if (!user) {
    // This should ideally be handled by a middleware or a protected route wrapper
    // but as a fallback, we can redirect or show an access denied message.
    // For now, we'll just render nothing and let the page.tsx handle the redirect.
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 text-white transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}
      >
        <div className="flex items-center justify-center h-16 bg-gray-900">
          <span className="text-2xl font-semibold">MM Dashboard</span>
        </div>
        <nav className="flex flex-col mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white"
              onClick={() => setSidebarOpen(false)} // Close sidebar on item click for mobile
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="flex items-center justify-between h-16 bg-white border-b border-gray-200 px-6">
          <div className="flex items-center">
            <button
              className="text-gray-500 focus:outline-none focus:text-gray-700 md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <h2 className="text-xl font-semibold text-gray-800 ml-4 md:ml-0">
              Welcome, {user.role}!
            </h2>
          </div>
          <div className="flex items-center">
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}