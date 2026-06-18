'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { dashboardService } from '@/modules/dashboard/dashboard.service';
import StatsCards from '@/modules/dashboard/components/StatsCards';
import { 
  ChartBarIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';

import { useAuthStore } from '../auth/auth.store';

export default function ReportsView() {
  const { user } = useAuthStore();
  const isOwner = user?.role === 'OWNER';
  const [exportingType, setExportingType] = useState<string | null>(null);

  // 1. Fetch dashboard summaries
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
    enabled: isOwner,
  });

  // 2. Fetch proposal status report details
  const { data: propReport, isLoading: isLoadingPropReport, refetch: refetchPropReport } = useQuery({
    queryKey: ['reportProposals'],
    queryFn: async () => {
      const response = await api.get('/reports/proposals');
      return response.data?.data || [];
    },
    enabled: isOwner,
  });

  // 3. Fetch pipeline stage funnel counts
  const { data: pipelineReport, isLoading: isLoadingPipelineReport, refetch: refetchPipelineReport } = useQuery({
    queryKey: ['reportPipeline'],
    queryFn: async () => {
      const response = await api.get('/reports/pipeline');
      return response.data?.data || [];
    },
    enabled: isOwner,
  });

  if (!isOwner) {
    return (
      <div className="p-8 bg-red-50 border border-red-200 rounded-xl text-red-700">
        <h2 className="text-lg font-bold mb-2">Access Denied</h2>
        <p className="text-sm">You do not have permission to view analytical reports.</p>
      </div>
    );
  }

  const handleRefreshAll = () => {
    refetchStats();
    refetchPropReport();
    refetchPipelineReport();
  };

  // CSV Export helper
  const handleExportCSV = async (type: 'profiles' | 'proposals' | 'pipelines') => {
    try {
      setExportingType(type);
      const endpoint = `/reports/export/${type}`;
      const response = await api.get(endpoint);
      const records = response.data?.data || [];

      if (records.length === 0) {
        alert(`No ${type} records found to export.`);
        setExportingType(null);
        return;
      }

      let csvContent = "";
      let filename = `${type}_report_${Date.now()}.csv`;

      if (type === 'profiles') {
        const headers = ["Profile ID", "Profile Number", "First Name", "Last Name", "Gender", "Status", "Type", "Completion %"];
        const rows = records.map((p: any) => [
          p.id,
          p.profileNumber,
          p.person?.firstName || "",
          p.person?.lastName || "",
          p.person?.gender || "",
          p.status,
          p.profileType,
          p.completionPercent
        ]);
        csvContent = [headers, ...rows].map((e: any[]) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      } else if (type === 'proposals') {
        const headers = ["Proposal ID", "Proposal Number", "Sender Agency", "Receiver Agency", "Bride Profile", "Groom Profile", "Status", "Created At"];
        const rows = records.map((p: any) => [
          p.id,
          p.proposalNumber,
          p.senderAgency?.name || "",
          p.receiverAgency?.name || "",
          p.brideProfile?.profileNumber || "",
          p.groomProfile?.profileNumber || "",
          p.proposalStatus,
          p.createdAt
        ]);
        csvContent = [headers, ...rows].map((e: any[]) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      } else if (type === 'pipelines') {
        const headers = ["Pipeline ID", "Proposal Number", "Bride Profile", "Groom Profile", "Current Stage", "Stage Date"];
        const rows = records.map((p: any) => [
          p.id,
          p.proposal?.proposalNumber || "",
          p.proposal?.brideProfile?.profileNumber || "",
          p.proposal?.groomProfile?.profileNumber || "",
          p.currentStage,
          p.stageDate
        ]);
        csvContent = [headers, ...rows].map((e: any[]) => e.map((val: any) => `"${String(val).replace(/"/g, '""')}"`).join(",")).join("\n");
      }

      // Download Trigger
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export report CSV.");
    } finally {
      setExportingType(null);
    }
  };

  // Render SVG Donut Chart for Proposal Statuses
  const renderDonutChart = () => {
    if (!propReport || propReport.length === 0) {
      return <div className="text-sm text-gray-400 py-10 text-center italic">No proposals logged.</div>;
    }

    const total = propReport.reduce((acc: number, item: any) => acc + item.count, 0);
    if (total === 0) return <div className="text-sm text-gray-400 py-10 text-center italic">No proposals logged.</div>;

    const size = 180;
    const center = size / 2;
    const radius = 60;
    const strokeWidth = 16;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;

    const slices = propReport.map((item: any, idx: number) => {
      const percentage = item.count / total;
      const strokeLength = percentage * circumference;
      const strokeOffset = circumference - strokeLength + (accumulatedPercentage * circumference);
      accumulatedPercentage += percentage;

      // Color mapping
      let strokeColor = "#3B82F6"; // default blue
      if (item.status === 'ACCEPTED') strokeColor = "#10B981"; // green
      else if (item.status === 'REJECTED') strokeColor = "#EF4444"; // red
      else if (item.status === 'SENT') strokeColor = "#8B5CF6"; // purple

      return {
        ...item,
        strokeLength,
        strokeOffset,
        strokeColor,
        percentageLabel: `${(percentage * 100).toFixed(0)}%`
      };
    });

    return (
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F3F4F6"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice: any, idx: number) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.strokeColor}
              strokeWidth={strokeWidth}
              strokeDasharray={`${slice.strokeLength} ${circumference}`}
              strokeDashoffset={slice.strokeOffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out hover:opacity-85 cursor-pointer"
            />
          ))}
          {/* Inner Text hole */}
          <circle
            cx={center}
            cy={center}
            r={radius - strokeWidth/2}
            fill="#FFFFFF"
          />
        </svg>

        {/* Legend */}
        <div className="flex flex-col gap-y-2 text-xs font-semibold text-gray-700">
          {slices.map((slice: any, idx: number) => (
            <div key={idx} className="flex items-center gap-x-2">
              <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: slice.strokeColor }} />
              <span className="capitalize">{slice.status.toLowerCase()}:</span>
              <strong className="text-gray-900">{slice.count} ({slice.percentageLabel})</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render SVG Funnel Chart for Pipeline Stages
  const renderFunnelChart = () => {
    if (!pipelineReport || pipelineReport.length === 0) {
      return <div className="text-sm text-gray-400 py-10 text-center italic">No active pipelines initialized.</div>;
    }

    const total = pipelineReport.reduce((acc: number, item: any) => acc + item.count, 0);
    if (total === 0) return <div className="text-sm text-gray-400 py-10 text-center italic">No active pipelines.</div>;

    const width = 340;
    const itemHeight = 35;
    const gap = 8;
    const height = pipelineReport.length * (itemHeight + gap);

    return (
      <div className="flex flex-col items-center">
        <svg width={width} height={height} className="overflow-visible">
          {pipelineReport.map((item: any, idx: number) => {
            // Calculate coordinates for funnel effect
            // First item is wider, subsequent items get narrow
            const progress = idx / pipelineReport.length;
            const nextProgress = (idx + 1) / pipelineReport.length;

            const currentWidth = width * (1.0 - progress * 0.4);
            const nextWidth = width * (1.0 - nextProgress * 0.4);

            const startX = (width - currentWidth) / 2;
            const endX = (width - nextWidth) / 2;
            const y = idx * (itemHeight + gap);

            const points = `
              ${startX},${y} 
              ${startX + currentWidth},${y} 
              ${endX + nextWidth},${y + itemHeight} 
              ${endX},${y + itemHeight}
            `;

            return (
              <g key={idx} className="group cursor-pointer">
                <polygon
                  points={points}
                  fill="url(#funnelGradient)"
                  opacity={0.95 - idx * 0.12}
                  className="transition-all duration-300 hover:opacity-100"
                />
                <text
                  x={width / 2}
                  y={y + itemHeight / 2 + 4}
                  textAnchor="middle"
                  fill="#FFFFFF"
                  className="text-[11px] font-bold select-none"
                >
                  {item.stage}: {item.count}
                </text>
              </g>
            );
          })}
          
          <defs>
            <linearGradient id="funnelGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="container mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-4 mb-6 border-b border-gray-200 pb-5">
        <div className="flex items-center gap-x-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-650 rounded-lg">
            <ChartBarIcon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Analytical Reports</h1>
            <p className="text-xs text-gray-550 mt-1">MatriMitra Scoped Tenant Intelligence Dashboard</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* CSV Export buttons */}
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={() => handleExportCSV('profiles')}
            className="inline-flex items-center gap-x-1.5 rounded-lg bg-white border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {exportingType === 'profiles' ? 'Exporting...' : 'Profiles CSV'}
          </button>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={() => handleExportCSV('proposals')}
            className="inline-flex items-center gap-x-1.5 rounded-lg bg-white border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {exportingType === 'proposals' ? 'Exporting...' : 'Proposals CSV'}
          </button>
          <button
            type="button"
            disabled={exportingType !== null}
            onClick={() => handleExportCSV('pipelines')}
            className="inline-flex items-center gap-x-1.5 rounded-lg bg-white border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="h-3.5 w-3.5" />
            {exportingType === 'pipelines' ? 'Exporting...' : 'Pipelines CSV'}
          </button>

          <button
            type="button"
            onClick={handleRefreshAll}
            className="inline-flex items-center justify-center gap-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* KPI statistics cards */}
      {isLoadingStats ? (
        <div className="text-center py-20 text-gray-500">Loading summary counts...</div>
      ) : isErrorStats || !stats ? (
        <div className="text-center py-20 text-red-650 font-semibold bg-white border border-gray-200 rounded-xl">
          Failed to load summary analytics. Check API connection.
        </div>
      ) : (
        <div className="space-y-6">
          <StatsCards
            totalProfiles={stats.totalProfiles}
            approvedProfiles={stats.approvedProfiles}
            pendingProfiles={stats.pendingProfiles}
            totalClients={stats.totalClients}
            matchesGenerated={stats.matchesGenerated}
            proposalsSent={stats.proposalsSent}
            acceptedProposals={stats.acceptedProposals}
            rejectedProposals={stats.rejectedProposals}
            activePipelines={stats.activePipelines}
            conversionRate={stats.conversionRate}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6">
            {/* Proposals status reporting block */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                  Proposals Status Distribution
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 mb-6">Visual breakdown of connection statuses for your agency</p>
              </div>
              <div className="py-4">
                {isLoadingPropReport ? (
                  <div className="text-sm text-gray-500 py-10 text-center">Loading status distribution...</div>
                ) : (
                  renderDonutChart()
                )}
              </div>
              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3 mt-4 text-center">
                Updates dynamically on proposal accept / reject events
              </div>
            </div>

            {/* Pipeline Stage funnel chart block */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                  Pipeline funnel progress
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 mb-6">Funnel visualization showing candidates per relationship stage</p>
              </div>
              <div className="py-4 flex justify-center">
                {isLoadingPipelineReport ? (
                  <div className="text-sm text-gray-500 py-10 text-center">Loading funnel progress...</div>
                ) : (
                  renderFunnelChart()
                )}
              </div>
              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3 mt-4 text-center">
                Reflects active verification pipelines
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-6 pt-6">
            {/* Most Viewed Profiles */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                Most Viewed Profiles
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 mb-4">Top profiles viewed by partner agencies</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-2 text-left font-semibold">Profile ID</th>
                      <th className="py-2 text-left font-semibold">Name</th>
                      <th className="py-2 text-right font-semibold">Views</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {stats.mostViewedProfiles && stats.mostViewedProfiles.length > 0 ? (
                      stats.mostViewedProfiles.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-2 font-medium text-indigo-600">{p.profileNumber}</td>
                          <td className="py-2">{p.name}</td>
                          <td className="py-2 text-right font-semibold text-gray-900">{p.views}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-gray-400 italic">No viewed profiles.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Profiles Never Viewed */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                Profiles Never Viewed
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 mb-4">Profiles that have not been viewed by any partner agency</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-2 text-left font-semibold">Profile ID</th>
                      <th className="py-2 text-left font-semibold">Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {stats.neverViewedProfiles && stats.neverViewedProfiles.length > 0 ? (
                      stats.neverViewedProfiles.map((p: any) => (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="py-2 font-medium text-indigo-600">{p.profileNumber}</td>
                          <td className="py-2">{p.name}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-400 italic">No never-viewed profiles.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-6 pt-6">
            {/* Completion Rate card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                  Follow-Up Completion
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 mb-6">Proportion of successfully processed follow-up items</p>
              </div>
              <div className="flex flex-col items-center py-6">
                <span className="text-5xl font-extrabold text-indigo-650">{stats.followUpCompletionRate || 0}%</span>
                <span className="text-xs text-gray-500 mt-2 font-semibold">Completion Rate</span>
              </div>
              <div className="text-[11px] text-gray-400 border-t border-gray-100 pt-3 text-center">
                Includes all registered follow-ups
              </div>
            </div>

            {/* Follow-ups Due Today */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-1 lg:col-span-1">
              <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                Due Today
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 mb-4">Pending items scheduled for today</p>
              <div className="overflow-x-auto max-h-[160px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-2 text-left font-semibold">Profile</th>
                      <th className="py-2 text-left font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {stats.todaysFollowUps && stats.todaysFollowUps.length > 0 ? (
                      stats.todaysFollowUps.map((f: any) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="py-2">
                            <span className="font-semibold text-indigo-650 block">{f.profileNumber}</span>
                            <span className="text-gray-555">{f.name}</span>
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              f.priority === 'HIGH' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                              f.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-805 ring-1 ring-inset ring-yellow-600/15' :
                              'bg-gray-50 text-gray-650 ring-1 ring-inset ring-gray-550/10'
                            }`}>
                              {f.priority}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-400 italic">No items due today.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Overdue Follow-ups */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 col-span-1 lg:col-span-1">
              <h3 className="text-base font-extrabold text-gray-800 border-b border-gray-100 pb-3">
                Overdue Items
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 mb-4">Pending items overdue</p>
              <div className="overflow-x-auto max-h-[160px] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead>
                    <tr className="text-gray-500">
                      <th className="py-2 text-left font-semibold">Profile</th>
                      <th className="py-2 text-left font-semibold">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-700">
                    {stats.overdueFollowUps && stats.overdueFollowUps.length > 0 ? (
                      stats.overdueFollowUps.map((f: any) => (
                        <tr key={f.id} className="hover:bg-gray-50">
                          <td className="py-2">
                            <span className="font-semibold text-red-650 block">{f.profileNumber}</span>
                            <span className="text-gray-555">{f.name}</span>
                          </td>
                          <td className="py-2">
                            <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                              f.priority === 'HIGH' ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10' :
                              f.priority === 'MEDIUM' ? 'bg-yellow-50 text-yellow-805 ring-1 ring-inset ring-yellow-600/15' :
                              'bg-gray-50 text-gray-655 ring-1 ring-inset ring-gray-550/10'
                            }`}>
                              {f.priority}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={2} className="py-4 text-center text-gray-400 italic">No overdue items.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
