'use client';

import { useAuthStore } from '../../store/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
          <p className="mt-4 text-gray-600">Please log in to view the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <p className="text-lg text-gray-700 mb-4">Welcome, {user.role}!</p>
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md">
          <p className="font-medium">Your Role: <span className="font-semibold">{user.role}</span></p>
          <p className="font-medium">Your Agency ID: <span className="font-semibold">{user.agencyId}</span></p>
        </div>
      </div>
    </div>
  );
}