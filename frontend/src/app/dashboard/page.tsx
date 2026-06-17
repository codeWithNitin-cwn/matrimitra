'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import StatsCards from "../../components/dashboard/StatsCards";
import { dashboardService } from "../../services/dashboard.service";
import api from "../../services/api";
import toast from 'react-hot-toast';
import { 
  UserPlusIcon,
  UserIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

const queryClient = new QueryClient();

const PIPELINE_STAGE_CONFIG = [
  { key: 'NEW_PROPOSAL', label: 'Proposal Sent', color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-150' },
  { key: 'PROFILE_SHARED', label: 'Profile Shared', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-150' },
  { key: 'INTERESTED', label: 'Mutual Interest', color: 'text-pink-600', bgColor: 'bg-pink-50 border-pink-150' },
  { key: 'MEETING_SCHEDULED', label: 'Meeting Scheduled', color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-150' },
  { key: 'FAMILY_DISCUSSION', label: 'Family Discussion', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-150' },
  { key: 'ENGAGEMENT', label: 'Engagement', color: 'text-teal-600', bgColor: 'bg-teal-50 border-teal-150' },
  { key: 'MARRIED', label: 'Married 🎊', color: 'text-emerald-600', bgColor: 'bg-emerald-50 border-emerald-150' },
  { key: 'CLOSED', label: 'Closed/Withdrawn', color: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-200' },
];

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

function DashboardContent() {
  const queryClient = useQueryClient();
  const [followUpTab, setFollowUpTab] = useState<'today' | 'overdue' | 'upcoming'>('today');

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/followups/${id}/complete`),
    onSuccess: () => {
      toast.success("Follow-up completed!");
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: () => {
      toast.error("Failed to complete follow-up.");
    }
  });

  const handleCompleteFollowUp = (id: string) => {
    completeMutation.mutate(id);
  };

  const { data: stats, isPending, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
  });

  const { data: propReport, isPending: isPendingPropReport } = useQuery({
    queryKey: ['reportProposals'],
    queryFn: async () => {
      const response = await api.get('/reports/proposals');
      return response.data?.data || [];
    }
  });

  const { data: pipelineReport, isPending: isPendingPipelineReport } = useQuery({
    queryKey: ['reportPipeline'],
    queryFn: async () => {
      const response = await api.get('/reports/pipeline');
      return response.data?.data || [];
    }
  });

  if (isPending || isPendingPropReport || isPendingPipelineReport) {
    return <div className="p-8 text-gray-600">Loading dashboard...</div>;
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-red-600">
        Error loading dashboard statistics. Please try again.
      </div>
    );
  }

  const pipelineCounts = (pipelineReport || []).reduce((acc: any, item: any) => {
    acc[item.stage] = item.count;
    return acc;
  }, {});

  const isPipelineEmpty = !pipelineReport || pipelineReport.length === 0 || pipelineReport.every((item: any) => item.count === 0);

  const renderDonutChart = () => {
    if (!propReport || propReport.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center w-full">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold text-gray-400">Empty</span>
          </div>
          <p className="text-xs text-gray-450 italic">No proposals logged for this agency.</p>
        </div>
      );
    }

    const total = propReport.reduce((acc: number, item: any) => acc + item.count, 0);
    if (total === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center w-full">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold text-gray-400">Empty</span>
          </div>
          <p className="text-xs text-gray-450 italic">No proposals logged for this agency.</p>
        </div>
      );
    }

    const size = 130;
    const center = size / 2;
    const radius = 42;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;

    let accumulatedPercentage = 0;

    const slices = propReport.map((item: any) => {
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
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
        <div className="relative">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-black text-gray-800">{total}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-y-1 text-xs font-semibold text-gray-700">
          {slices.map((slice: any, idx: number) => (
            <div key={idx} className="flex items-center gap-x-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: slice.strokeColor }} />
              <span className="capitalize text-gray-650">{slice.status.toLowerCase()}:</span>
              <strong className="text-gray-900">{slice.count} ({slice.percentageLabel})</strong>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
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

      {/* AI Action Center Widget */}
      <div className="mx-6 bg-white p-6 rounded-xl border border-gray-150 shadow-sm animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider flex items-center gap-x-2">
              <SparklesIcon className="h-5 w-5 text-indigo-500 animate-pulse" /> AI Action Center
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Automated recommendations and follow-up alerts based on agency activity</p>
          </div>
        </div>

        {!stats.aiRecommendations || stats.aiRecommendations.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400 italic bg-gray-50/30 rounded-xl border border-dashed border-gray-150">
            No recommendations or follow-up actions detected at this time.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.aiRecommendations.map((rec: any) => {
              let priorityColor = "text-blue-700 bg-blue-50 border-blue-200";
              let actionLink = "/dashboard";
              if (rec.priority === "HIGH") {
                priorityColor = "text-rose-700 bg-rose-50 border-rose-200";
              } else if (rec.priority === "MEDIUM") {
                priorityColor = "text-amber-700 bg-amber-50 border-amber-200";
              }

              if (rec.title === "Proposal Follow-Up") {
                actionLink = "/dashboard/proposals";
              } else if (rec.title === "Initialize Pipeline") {
                actionLink = "/dashboard/pipeline";
              } else if (rec.title === "Pipeline Stage Stalled") {
                actionLink = "/dashboard/pipeline";
              } else if (rec.title === "Run Match Search") {
                actionLink = `/dashboard/matches?profileId=${rec.entityId}`;
              }

              return (
                <div 
                  key={rec.id}
                  className="p-4 rounded-xl border border-gray-150 bg-gray-50/30 hover:bg-gray-50/70 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-gray-800">{rec.title}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${priorityColor}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-gray-650 leading-relaxed mb-3">{rec.reason}</p>
                  </div>
                  <div className="flex justify-end pt-2 border-t border-gray-100">
                    <Link
                      href={actionLink}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-x-1"
                    >
                      {rec.action} &rarr;
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pipeline Summary Widget */}
      <div className="mx-6 bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Pipeline Stage Summary</h2>
            <p className="text-xs text-gray-500 mt-0.5">Active and completed connections in relationship milestones</p>
          </div>
          <Link href="/dashboard/pipeline" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
            Manage Pipelines
          </Link>
        </div>
        
        {isPipelineEmpty ? (
          <div className="p-8 text-center text-sm text-gray-400 italic bg-gray-50/30 rounded-xl border border-dashed border-gray-150">
            No active pipeline stages recorded.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {PIPELINE_STAGE_CONFIG.map((stage) => {
              const count = pipelineCounts[stage.key] || 0;
              return (
                <div 
                  key={stage.key} 
                  className={`flex flex-col items-center justify-between p-4 border rounded-xl transition text-center min-h-[110px] ${
                    count > 0 
                      ? `${stage.bgColor} hover:shadow-sm scale-[1.02] transform transition-transform` 
                      : 'bg-gray-50/50 border-gray-100 opacity-60'
                  }`}
                >
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{stage.label}</span>
                  <p className="text-2xl font-black text-gray-800 my-2">{count}</p>
                  <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-semibold ring-1 ring-inset ${
                    count > 0 ? 'bg-white/80 text-gray-700 ring-gray-200' : 'bg-transparent text-gray-400 ring-transparent'
                  }`}>
                    {count > 0 ? 'Active' : 'Idle'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row of Charts & Metrics */}
      <div className="mx-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Proposal Status Donut Chart */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Proposal Status</h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution of sent/accepted/rejected proposals</p>
          </div>
          <div className="py-6 flex justify-center items-center h-full">
            {renderDonutChart()}
          </div>
        </div>

        {/* Right: Match Conversion Metrics */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-150 shadow-sm flex flex-col justify-between">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Match Conversion Metrics</h2>
            <p className="text-xs text-gray-500 mt-0.5">Funnel and conversion efficiency of generated profile matches</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            {/* Matches Generated */}
            <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-xl flex flex-col justify-between hover:bg-gray-50 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Matches Generated</span>
                <p className="text-3xl font-extrabold text-gray-850 mt-1">{stats.matchesGenerated}</p>
              </div>
              <span className="text-[10px] text-pink-500 font-semibold flex items-center gap-x-1 mt-3">
                <SparklesIcon className="h-3.5 w-3.5" /> Direct Compatibilities
              </span>
            </div>

            {/* Proposals Sent */}
            <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-xl flex flex-col justify-between hover:bg-gray-50 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Proposals Sent</span>
                <p className="text-3xl font-extrabold text-gray-850 mt-1">{stats.proposalsSent}</p>
              </div>
              <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-x-1 mt-3">
                <DocumentTextIcon className="h-3.5 w-3.5" /> Outgoing proposals
              </span>
            </div>

            {/* Accepted Proposals */}
            <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-xl flex flex-col justify-between hover:bg-gray-50 transition-colors">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Accepted Proposals</span>
                <p className="text-3xl font-extrabold text-gray-850 mt-1">{stats.acceptedProposals}</p>
              </div>
              <span className="text-[10px] text-green-500 font-semibold flex items-center gap-x-1 mt-3">
                <ArrowPathRoundedSquareIcon className="h-3.5 w-3.5" /> Confirmed matches
              </span>
            </div>

            {/* Conversion % */}
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-5 border border-indigo-100/50 rounded-xl flex flex-col justify-between hover:shadow-sm transition-all relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 translate-x-2 translate-y-2">
                <ArrowTrendingUpIcon className="h-24 w-24 text-indigo-600" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">Conversion %</span>
                <p className="text-3xl font-extrabold text-indigo-900 mt-1">{stats.matchConversionRate ?? 0}%</p>
              </div>
              <span className="text-[10px] text-indigo-700 font-semibold flex items-center gap-x-1 mt-3">
                <ArrowTrendingUpIcon className="h-3.5 w-3.5" /> Match-to-Accept Rate
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Widget */}
      <div className="mx-6 bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/dashboard/clients"
            className="flex items-center gap-x-3 p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition group"
          >
            <div className="p-2.5 bg-blue-100/80 rounded-lg text-blue-600 group-hover:scale-105 transition-transform">
              <UserPlusIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-850">Create Client</span>
              <span className="block text-[11px] text-gray-500">Register new clients</span>
            </div>
          </Link>
          <Link
            href="/dashboard/profiles/create"
            className="flex items-center gap-x-3 p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition group"
          >
            <div className="p-2.5 bg-indigo-100/80 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-850">Create Profile</span>
              <span className="block text-[11px] text-gray-500">Onboard bride/groom</span>
            </div>
          </Link>
          <Link
            href="/dashboard/matches"
            className="flex items-center gap-x-3 p-4 bg-pink-50/50 hover:bg-pink-50 border border-pink-100 rounded-xl transition group"
          >
            <div className="p-2.5 bg-pink-100/80 rounded-lg text-pink-600 group-hover:scale-105 transition-transform">
              <SparklesIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-850">Search Matches</span>
              <span className="block text-[11px] text-gray-500">Find compatibilities</span>
            </div>
          </Link>
          <Link
            href="/dashboard/proposals"
            className="flex items-center gap-x-3 p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-xl transition group"
          >
            <div className="p-2.5 bg-purple-100/80 rounded-lg text-purple-600 group-hover:scale-105 transition-transform">
              <DocumentTextIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-gray-850">Review Proposals</span>
              <span className="block text-[11px] text-gray-500">Manage connection status</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Activity Feed */}
      <div className="mx-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card: Follow-Up Tasks */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-150 flex flex-col sm:flex-row justify-between sm:items-center gap-y-2">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Follow-Up Management
              </h3>
              <div className="flex gap-x-2 text-xs">
                <button
                  onClick={() => setFollowUpTab('today')}
                  className={`px-3 py-1.5 font-bold rounded-md transition ${followUpTab === 'today' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Today ({stats.todaysFollowUps?.length || 0})
                </button>
                <button
                  onClick={() => setFollowUpTab('overdue')}
                  className={`px-3 py-1.5 font-bold rounded-md transition ${followUpTab === 'overdue' ? 'bg-red-650 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Overdue ({stats.overdueFollowUps?.length || 0})
                </button>
                <button
                  onClick={() => setFollowUpTab('upcoming')}
                  className={`px-3 py-1.5 font-bold rounded-md transition ${followUpTab === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Upcoming ({stats.upcomingFollowUps?.length || 0})
                </button>
              </div>
            </div>
            <div className="divide-y divide-gray-100">
              {(() => {
                const list = followUpTab === 'today' ? stats.todaysFollowUps :
                             followUpTab === 'overdue' ? stats.overdueFollowUps : stats.upcomingFollowUps;
                
                if (!list || list.length === 0) {
                  return (
                    <div className="p-8 text-center text-sm text-gray-400 italic bg-white">
                      No follow-ups found in this category.
                    </div>
                  );
                }

                return list.map((item: any) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between gap-x-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {item.name} ({item.profileNumber})
                      </h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Due: {new Date(item.dueDate).toLocaleDateString()} • Priority:{' '}
                        <span className={`font-bold ${item.priority === 'HIGH' ? 'text-red-600' : item.priority === 'MEDIUM' ? 'text-yellow-600' : 'text-gray-650'}`}>
                          {item.priority}
                        </span>
                      </p>
                      {item.notes && <p className="text-xs text-gray-600 italic mt-1">Note: {item.notes}</p>}
                    </div>
                    <button
                      onClick={() => handleCompleteFollowUp(item.id)}
                      disabled={completeMutation.isPending}
                      className="text-xs font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-100 rounded-md px-3 py-1.5 transition hover:cursor-pointer disabled:opacity-50"
                    >
                      Complete
                    </button>
                  </div>
                ));
              })()}
            </div>
          </div>
          
          {/* Card: Pending Profiles */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Pending Profiles ({stats.pendingApprovalProfiles?.length || 0})
              </h3>
              {stats.pendingApprovalProfiles && stats.pendingApprovalProfiles.length > 0 && (
                <Link href="/dashboard/profiles" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {stats.pendingApprovalProfiles && stats.pendingApprovalProfiles.length > 0 ? (
                stats.pendingApprovalProfiles.map((p: any) => (
                  <div key={p.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between gap-x-4">
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">{p.person?.firstName} {p.person?.lastName || ''}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">Profile: {p.profileNumber} • Gender: {p.person?.gender || 'N/A'}</p>
                    </div>
                    <Link
                      href={`/dashboard/profiles/${p.id}`}
                      className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-md px-3 py-1.5 transition"
                    >
                      Review
                    </Link>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-gray-400 italic bg-white">
                  No profiles pending approval at this time.
                </div>
              )}
            </div>
          </div>

          {/* Card: Pending Proposals */}
          <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gray-50 border-b border-gray-150 flex justify-between items-center">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Pending Received Proposals ({stats.pendingReceivedProposals?.length || 0})
              </h3>
              {stats.pendingReceivedProposals && stats.pendingReceivedProposals.length > 0 && (
                <Link href="/dashboard/proposals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  View All
                </Link>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {stats.pendingReceivedProposals && stats.pendingReceivedProposals.length > 0 ? (
                stats.pendingReceivedProposals.map((prop: any) => {
                  const brideName = prop.brideProfile?.person?.firstName || 'Bride';
                  const groomName = prop.groomProfile?.person?.firstName || 'Groom';
                  return (
                    <div key={prop.id} className="p-4 hover:bg-gray-50 transition flex items-center justify-between gap-x-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-900">
                          Proposal: {groomName} & {brideName}
                        </h4>
                        <p className="text-xs text-gray-500 mt-0.5">
                          From: {prop.senderAgency?.name || 'Partner Agency'} • Proposal #: {prop.proposalNumber}
                        </p>
                      </div>
                      <Link
                        href="/dashboard/proposals"
                        className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-md px-3 py-1.5 transition"
                      >
                        Review
                      </Link>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm text-gray-400 italic bg-white">
                  No proposals pending approval at this time.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column - Recent Activity Feed */}
        <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden h-fit">
          <div className="px-5 py-4 bg-gray-50 border-b border-gray-150">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
              Recent Activities
            </h3>
          </div>
          <div className="p-5">
            {stats.recentActivities && stats.recentActivities.length > 0 ? (
              <ul className="relative border-l border-gray-100 space-y-6">
                {stats.recentActivities.map((act: any) => (
                  <li key={act.id} className="relative pl-5 group">
                    <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border border-white bg-indigo-500 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{act.description}</p>
                      <time className="text-[10px] font-semibold text-gray-400 block mt-1">
                        {formatRelativeTime(new Date(act.createdAt))}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 text-sm text-gray-400 italic">
                No recent activity logged for this agency.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}