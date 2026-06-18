import React from 'react';
import { 
  UsersIcon, 
  DocumentTextIcon, 
  ArrowPathRoundedSquareIcon, 
  UserGroupIcon, 
  SparklesIcon, 
  PresentationChartLineIcon 
} from '@heroicons/react/24/outline';

interface StatsCardsProps {
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  totalClients: number;
  matchesGenerated: number;
  proposalsSent: number;
  acceptedProposals: number;
  rejectedProposals: number;
  activePipelines: number;
  conversionRate: number;
}

export default function StatsCards({
  totalProfiles,
  approvedProfiles,
  pendingProfiles,
  totalClients,
  matchesGenerated,
  proposalsSent,
  acceptedProposals,
  rejectedProposals,
  activePipelines,
  conversionRate
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      
      {/* Profiles Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Profiles</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalProfiles}</p>
          </div>
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
            <UsersIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex gap-x-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <div>Approved: <strong className="text-green-600">{approvedProfiles}</strong></div>
          <div>Pending: <strong className="text-amber-600">{pendingProfiles}</strong></div>
        </div>
      </div>

      {/* Clients Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Clients</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalClients}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <UserGroupIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <span>Active matching profiles associated with clients.</span>
        </div>
      </div>

      {/* Matches Generated Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Matches Generated</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{matchesGenerated}</p>
          </div>
          <div className="p-3 bg-pink-50 rounded-lg text-pink-600">
            <SparklesIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <span>Total calculated profile compatibilities.</span>
        </div>
      </div>

      {/* Proposals Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposals Sent</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{proposalsSent}</p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <DocumentTextIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 flex gap-x-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <div>Accepted: <strong className="text-green-600">{acceptedProposals}</strong></div>
          <div>Rejected: <strong className="text-red-600">{rejectedProposals}</strong></div>
        </div>
      </div>

      {/* Active Pipelines Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Pipelines</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{activePipelines}</p>
          </div>
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ArrowPathRoundedSquareIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 text-xs text-gray-500 border-t border-gray-50 pt-3">
          <span>Pipelines currently in verification/stages.</span>
        </div>
      </div>

      {/* Conversion Rate Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-150 relative overflow-hidden group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proposal Success Rate</h3>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{conversionRate}%</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
            <PresentationChartLineIcon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 mt-4">
          <div 
            className="h-1.5 rounded-full bg-amber-500" 
            style={{ width: `${conversionRate}%` }} 
          />
        </div>
      </div>

    </div>
  );
}
