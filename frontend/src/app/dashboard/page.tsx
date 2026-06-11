'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useAuthStore } from '../../store/auth.store';
import StatsCards from "../../components/dashboard/StatsCards";


const queryClient = new QueryClient();

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <QueryClientProvider client={queryClient}>
      <StatsCards />
    </QueryClientProvider>
  );
}