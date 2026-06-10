'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboard.service';

const StatCard = ({ title, value, isLoading }: { title: string; value?: number | string; isLoading: boolean }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-sm font-medium text-gray-500 truncate">{title}</h3>
    {isLoading ? (
      <div className="mt-1 h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
    ) : (
      <p className="mt-1 text-3xl font-semibold text-gray-900">{value ?? 'N/A'}</p>
    )}
  </div>
);

export default function StatsCards() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
    retry: false,
  });

  if (isError) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
        <p className="font-bold">Error Loading Statistics</p>
        <p>{error instanceof Error ? error.message : 'An unknown error occurred.'}</p>
      </div>
    );
  }

  const stats = [
    { title: 'Total Agencies', value: data?.totalAgencies },
    { title: 'Total Profiles', value: data?.totalProfiles },
    { title: 'Total Proposals', value: data?.totalProposals },
    { title: 'Accepted Proposals', value: data?.acceptedProposals },
    { title: 'Rejected Proposals', value: data?.rejectedProposals },
    { title: 'Active Pipelines', value: data?.activePipelines },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <StatCard 
          key={stat.title} 
          title={stat.title} 
          value={stat.value} 
          isLoading={isLoading} 
        />
      ))}
    </div>
  );
}