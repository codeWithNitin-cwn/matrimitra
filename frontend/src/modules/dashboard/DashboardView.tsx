'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import StatsCards from "./components/StatsCards";
import { dashboardService } from "./dashboard.service";
import api from "../../services/api";
import toast from 'react-hot-toast';
import { useAuthStore } from '../auth/auth.store';
import { 
  UserPlusIcon,
  UserIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowPathRoundedSquareIcon
} from '@heroicons/react/24/outline';

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

export default function DashboardView() {
  const { user } = useAuthStore();
  const role = user?.role || 'OWNER';
  const agencyId = user?.agencyId;
  const queryClient = useQueryClient();
  const [followUpTab, setFollowUpTab] = useState<'today' | 'overdue' | 'upcoming'>('today');

  const completeMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/followups/${id}/complete`),
    onSuccess: () => {
      toast.success("Follow-up completed!");
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFollowups'] });
    },
    onError: () => {
      toast.error("Failed to complete follow-up.");
    }
  });

  const handleCompleteFollowUp = (id: string) => {
    completeMutation.mutate(id);
  };

  // 1. If role is OWNER, fetch the original report summary
  const { data: statsRaw, isPending: isPendingStats, isError: isErrorStats } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => dashboardService.getStats(),
    enabled: role === 'OWNER',
  });

  // 2. Fetch profiles list if PROFILE_MANAGER or MATCHING_MANAGER or RELATIONSHIP_MANAGER
  const { data: profiles, isPending: isPendingProfiles } = useQuery({
    queryKey: ['dashboardProfiles'],
    queryFn: async () => {
      const res = await api.get('/profiles');
      return res.data?.data || [];
    },
    enabled: role === 'PROFILE_MANAGER' || role === 'MATCHING_MANAGER' || role === 'RELATIONSHIP_MANAGER',
  });

  // 3. Fetch clients list if PROFILE_MANAGER
  const { data: clients, isPending: isPendingClients } = useQuery({
    queryKey: ['dashboardClients'],
    queryFn: async () => {
      const res = await api.get('/clients');
      return res.data?.data || [];
    },
    enabled: role === 'PROFILE_MANAGER',
  });

  // 4. Fetch proposals list if RELATIONSHIP_MANAGER
  const { data: proposals, isPending: isPendingProposals } = useQuery({
    queryKey: ['dashboardProposals'],
    queryFn: async () => {
      const res = await api.get('/proposals');
      return res.data?.data || [];
    },
    enabled: role === 'RELATIONSHIP_MANAGER',
  });

  // 5. Fetch followups list if RELATIONSHIP_MANAGER
  const { data: followUps, isPending: isPendingFollowups } = useQuery({
    queryKey: ['dashboardFollowups'],
    queryFn: async () => {
      const res = await api.get('/followups');
      return res.data?.data || [];
    },
    enabled: role === 'RELATIONSHIP_MANAGER',
  });

  // 6. Proposal reports (only for OWNER)
  const { data: propReport, isPending: isPendingPropReport } = useQuery({
    queryKey: ['reportProposals'],
    queryFn: async () => {
      const response = await api.get('/reports/proposals');
      return response.data?.data || [];
    },
    enabled: role === 'OWNER',
  });

  // 7. Pipeline reports (only for OWNER)
  const { data: pipelineReport, isPending: isPendingPipelineReport } = useQuery({
    queryKey: ['reportPipeline'],
    queryFn: async () => {
      const response = await api.get('/reports/pipeline');
      return response.data?.data || [];
    },
    enabled: role === 'OWNER',
  });

  const isPending = (role === 'OWNER' && (isPendingStats || isPendingPropReport || isPendingPipelineReport)) ||
                    (role === 'PROFILE_MANAGER' && (isPendingProfiles || isPendingClients)) ||
                    (role === 'MATCHING_MANAGER' && isPendingProfiles) ||
                    (role === 'RELATIONSHIP_MANAGER' && (isPendingProposals || isPendingFollowups));

  const isError = role === 'OWNER' ? isErrorStats : false;

  const stats = React.useMemo(() => {
    if (role === 'OWNER') {
      return statsRaw || {};
    }

    const baseStats: any = {
      totalProfiles: 0,
      approvedProfiles: 0,
      pendingProfiles: 0,
      totalClients: 0,
      matchesGenerated: 0,
      proposalsSent: 0,
      acceptedProposals: 0,
      rejectedProposals: 0,
      activePipelines: 0,
      conversionRate: 0,
      matchConversionRate: 0,
      pendingApprovalProfiles: [],
      pendingReceivedProposals: [],
      recentActivities: [],
      aiRecommendations: [],
      todaysFollowUps: [],
      overdueFollowUps: [],
      upcomingFollowUps: []
    };

    if (role === 'PROFILE_MANAGER') {
      const totalProfiles = (profiles || []).length;
      const approvedProfiles = (profiles || []).filter((p: any) => p.status === 'ACTIVE' || p.status === 'APPROVED').length;
      const pendingProfiles = (profiles || []).filter((p: any) => p.status === 'PENDING').length;
      const totalClients = (clients || []).length;
      const pendingApprovalProfiles = (profiles || []).filter((p: any) => p.status === 'PENDING').slice(0, 5);

      return {
        ...baseStats,
        totalProfiles,
        approvedProfiles,
        pendingProfiles,
        totalClients,
        pendingApprovalProfiles
      };
    }

    if (role === 'MATCHING_MANAGER') {
      const matchesGenerated = (profiles || []).reduce((sum: number, p: any) => {
        return sum + (p._count?.compatibilitiesSent || 0);
      }, 0);

      return {
        ...baseStats,
        matchesGenerated
      };
    }

    if (role === 'RELATIONSHIP_MANAGER') {
      const props = proposals || [];
      const proposalsSent = props.filter((p: any) => p.senderAgencyId === agencyId).length;
      const acceptedProposals = props.filter((p: any) => p.proposalStatus === 'ACCEPTED').length;
      const rejectedProposals = props.filter((p: any) => p.proposalStatus === 'REJECTED').length;
      const activePipelines = props.filter((p: any) => p.proposalStatus === 'ACCEPTED' && p.pipeline && !['MARRIED', 'CLOSED'].includes(p.pipeline.currentStage)).length;
      const totalCompleted = acceptedProposals + rejectedProposals;
      const conversionRate = totalCompleted > 0 ? Math.round((acceptedProposals / totalCompleted) * 100) : 0;

      const pendingReceivedProposals = props.filter((p: any) => p.receiverAgencyId === agencyId && p.proposalStatus === 'SENT').slice(0, 5);

      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const fList = followUps || [];
      const todaysFollowUps = fList
        .filter((f: any) => f.status === 'PENDING' && new Date(f.dueDate) >= startOfToday && new Date(f.dueDate) <= endOfToday)
        .map((f: any) => ({
          id: f.id,
          profileNumber: f.profile?.profileNumber || '',
          name: f.profile?.person ? `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim() : 'N/A',
          dueDate: f.dueDate,
          priority: f.priority,
          notes: f.notes
        }));

      const overdueFollowUps = fList
        .filter((f: any) => f.status === 'PENDING' && new Date(f.dueDate) < startOfToday)
        .map((f: any) => ({
          id: f.id,
          profileNumber: f.profile?.profileNumber || '',
          name: f.profile?.person ? `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim() : 'N/A',
          dueDate: f.dueDate,
          priority: f.priority,
          notes: f.notes
        }));

      const upcomingFollowUps = fList
        .filter((f: any) => f.status === 'PENDING' && new Date(f.dueDate) > endOfToday)
        .map((f: any) => ({
          id: f.id,
          profileNumber: f.profile?.profileNumber || '',
          name: f.profile?.person ? `${f.profile.person.firstName} ${f.profile.person.lastName || ''}`.trim() : 'N/A',
          dueDate: f.dueDate,
          priority: f.priority,
          notes: f.notes
        }));

      return {
        ...baseStats,
        proposalsSent,
        acceptedProposals,
        rejectedProposals,
        activePipelines,
        conversionRate,
        pendingReceivedProposals,
        todaysFollowUps,
        overdueFollowUps,
        upcomingFollowUps
      };
    }

    return baseStats;
  }, [role, statsRaw, profiles, clients, proposals, followUps, agencyId]);

  if (isPending) {
    return <div className="p-8 text-gray-600">Loading dashboard...</div>;
  }

  if (isError || !stats) {
    return (
      <div className="p-8 text-red-600">
        Error loading dashboard statistics. Please try again.
      </div>
    );
  }

  const computedPipelineReport = (() => {
    if (role === 'OWNER') {
      return pipelineReport || [];
    }
    if (role === 'RELATIONSHIP_MANAGER') {
      const counts: Record<string, number> = {};
      (proposals || []).forEach((p: any) => {
        if (p.proposalStatus === 'ACCEPTED' && p.pipeline?.currentStage) {
          const stage = p.pipeline.currentStage;
          counts[stage] = (counts[stage] || 0) + 1;
        }
      });
      return Object.entries(counts).map(([stage, count]) => ({
        stage,
        count
      }));
    }
    return [];
  })();

  const pipelineCounts = computedPipelineReport.reduce((acc: any, item: any) => {
    acc[item.stage] = item.count;
    return acc;
  }, {});

  const isPipelineEmpty = computedPipelineReport.length === 0 || computedPipelineReport.every((item: any) => item.count === 0);

  const computedPropReport = (() => {
    if (role === 'OWNER') {
      return propReport || [];
    }
    if (role === 'RELATIONSHIP_MANAGER') {
      const counts: Record<string, number> = {};
      (proposals || []).forEach((p: any) => {
        if (p.proposalStatus) {
          const status = p.proposalStatus;
          counts[status] = (counts[status] || 0) + 1;
        }
      });
      return Object.entries(counts).map(([status, count]) => ({
        status,
        count
      }));
    }
    return [];
  })();

  const renderDonutChart = () => {
    if (computedPropReport.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-center w-full">
          <div className="w-20 h-20 rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center mb-3">
            <span className="text-[10px] font-bold text-gray-400">Empty</span>
          </div>
          <p className="text-xs text-gray-450 italic">No proposals logged for this agency.</p>
        </div>
      );
    }

    const total = computedPropReport.reduce((acc: number, item: any) => acc + item.count, 0);
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

    const slices = computedPropReport.map((item: any) => {
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
        role={role}
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
      {role === 'OWNER' && (
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
      )}

      {/* Pipeline Summary Widget */}
      {(role === 'OWNER' || role === 'RELATIONSHIP_MANAGER') && (
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
      )}

      {/* Row of Charts & Metrics */}
      {(role === 'OWNER' || role === 'RELATIONSHIP_MANAGER') && (
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

          {/* Right: Match Conversion Metrics (OWNER ONLY) */}
          {role === 'OWNER' && (
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
                    <p className="text-3xl font-extrabold text-gray-855 mt-1">{stats.matchesGenerated}</p>
                  </div>
                  <span className="text-[10px] text-pink-500 font-semibold flex items-center gap-x-1 mt-3">
                    <SparklesIcon className="h-3.5 w-3.5" /> Direct Compatibilities
                  </span>
                </div>

                {/* Proposals Sent */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-xl flex flex-col justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Proposals Sent</span>
                    <p className="text-3xl font-extrabold text-gray-855 mt-1">{stats.proposalsSent}</p>
                  </div>
                  <span className="text-[10px] text-purple-500 font-semibold flex items-center gap-x-1 mt-3">
                    <DocumentTextIcon className="h-3.5 w-3.5" /> Outgoing proposals
                  </span>
                </div>

                {/* Accepted Proposals */}
                <div className="bg-gray-50/50 p-5 border border-gray-100 rounded-xl flex flex-col justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Accepted Proposals</span>
                    <p className="text-3xl font-extrabold text-gray-855 mt-1">{stats.acceptedProposals}</p>
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
          )}
        </div>
      )}

      {/* Quick Actions Widget */}
      <div className="mx-6 bg-white p-6 rounded-xl border border-gray-150 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(role === 'OWNER' || role === 'PROFILE_MANAGER') && (
            <Link
              href="/dashboard/clients"
              className="flex items-center gap-x-3 p-4 bg-blue-50/50 hover:bg-blue-50 border border-blue-100 rounded-xl transition group"
            >
              <div className="p-2.5 bg-blue-100/80 rounded-lg text-blue-600 group-hover:scale-105 transition-transform">
                <UserPlusIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-855">Create Client</span>
                <span className="block text-[11px] text-gray-500">Register new clients</span>
              </div>
            </Link>
          )}
          {(role === 'OWNER' || role === 'PROFILE_MANAGER') && (
            <Link
              href="/dashboard/profiles/create"
              className="flex items-center gap-x-3 p-4 bg-indigo-50/50 hover:bg-indigo-50 border border-indigo-100 rounded-xl transition group"
            >
              <div className="p-2.5 bg-indigo-100/80 rounded-lg text-indigo-600 group-hover:scale-105 transition-transform">
                <UserIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-855">Create Profile</span>
                <span className="block text-[11px] text-gray-500">Onboard bride/groom</span>
              </div>
            </Link>
          )}
          {(role === 'OWNER' || role === 'MATCHING_MANAGER') && (
            <Link
              href="/dashboard/matches"
              className="flex items-center gap-x-3 p-4 bg-pink-50/50 hover:bg-pink-50 border border-pink-100 rounded-xl transition group"
            >
              <div className="p-2.5 bg-pink-100/80 rounded-lg text-pink-600 group-hover:scale-105 transition-transform">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-855">Search Matches</span>
                <span className="block text-[11px] text-gray-500">Find compatibilities</span>
              </div>
            </Link>
          )}
          {(role === 'OWNER' || role === 'RELATIONSHIP_MANAGER') && (
            <Link
              href="/dashboard/proposals"
              className="flex items-center gap-x-3 p-4 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 rounded-xl transition group"
            >
              <div className="p-2.5 bg-purple-100/80 rounded-lg text-purple-650 group-hover:scale-105 transition-transform">
                <DocumentTextIcon className="h-5 w-5" />
              </div>
              <div>
                <span className="block text-sm font-bold text-gray-855">Review Proposals</span>
                <span className="block text-[11px] text-gray-500">Manage connection status</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Pending Approvals & Activity Feed */}
      <div className="mx-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Pending Approvals */}
        <div className="lg:col-span-2 space-y-6">

          {/* Card: Follow-Up Tasks */}
          {(role === 'OWNER' || role === 'RELATIONSHIP_MANAGER') && (
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
          )}
          
          {/* Card: Pending Profiles */}
          {(role === 'OWNER' || role === 'PROFILE_MANAGER') && (
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
          )}

          {/* Card: Pending Proposals */}
          {(role === 'OWNER' || role === 'RELATIONSHIP_MANAGER') && (
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
          )}

        </div>

        {/* Right Column - Recent Activity Feed (OWNER ONLY) */}
        {role === 'OWNER' && (
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
        )}

      </div>
    </div>
  );
}
