'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProposalService } from '@/services/proposal.service';
import { useAuthStore } from '@/store/auth.store';
import { CheckIcon, XMarkIcon, EyeIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function ProposalsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Modal State for Action (Accept/Reject)
  const [actionType, setActionType] = useState<'ACCEPT' | 'REJECT' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch proposals
  const { data: proposals, isLoading, isError } = useQuery({
    queryKey: ['proposals'],
    queryFn: ProposalService.getProposals,
  });

  // Fetch selected proposal details (including activities)
  const { data: proposalDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['proposal', selectedProposalId],
    queryFn: () => ProposalService.getProposalById(selectedProposalId!),
    enabled: !!selectedProposalId,
  });

  // Accept Mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => {
      return ProposalService.acceptProposal(id, {
        performedBy: user!.id,
        activityNotes: actionNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setActionType(null);
      setActionNotes('');
      setActionError(null);
      alert('Proposal accepted successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || err.message || 'Failed to accept proposal.');
    }
  });

  // Reject Mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => {
      return ProposalService.rejectProposal(id, {
        performedBy: user!.id,
        activityNotes: actionNotes.trim() || undefined,
      });
    },
    onSuccess: () => {
      setActionType(null);
      setActionNotes('');
      setActionError(null);
      alert('Proposal rejected successfully.');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (err: any) => {
      setActionError(err.response?.data?.error?.message || err.message || 'Failed to reject proposal.');
    }
  });

  const handleOpenActionModal = (type: 'ACCEPT' | 'REJECT') => {
    if (!selectedProposalId) return;
    setActionType(type);
    setActionNotes('');
    setActionError(null);
  };

  const handleSubmitAction = () => {
    if (!selectedProposalId) return;
    if (actionType === 'ACCEPT') {
      acceptMutation.mutate(selectedProposalId);
    } else if (actionType === 'REJECT') {
      rejectMutation.mutate(selectedProposalId);
    }
  };

  return (
    <div className="container mx-auto flex flex-col lg:flex-row gap-6">
      {/* Main Table Column */}
      <div className="flex-1 bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Match Proposals</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proposal No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bride Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Groom Profile</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agencies (From → To)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500">Loading proposals...</td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-red-600">Failed to load proposals.</td>
                </tr>
              )}

              {!isLoading && !isError && proposals.length > 0 ? (
                proposals.map((prop: any) => (
                  <tr
                    key={prop.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 cursor-pointer ${
                      selectedProposalId === prop.id ? 'bg-indigo-50/40' : ''
                    }`}
                    onClick={() => {
                      setSelectedProposalId(prop.id);
                      setActionError(null);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {prop.proposalNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ID: {prop.brideProfileId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      ID: {prop.groomProfileId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {prop.senderAgency?.name || 'MM System'} → {prop.receiverAgency?.name || 'Partner'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        prop.proposalStatus === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        prop.proposalStatus === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {prop.proposalStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedProposalId(prop.id)}
                        className="text-indigo-600 hover:text-indigo-900 inline-flex items-center gap-x-1"
                      >
                        <EyeIcon className="h-4 w-4" /> View Detail
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                !isLoading && !isError && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500">No proposals found.</td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side Drawer */}
      {selectedProposalId && (
        <div className="w-full lg:w-96 bg-white shadow-md rounded-lg p-6 border border-gray-200 self-start">
          <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-4">
            <h3 className="text-lg font-bold text-gray-900">Proposal Details</h3>
            <button
              onClick={() => setSelectedProposalId(null)}
              className="text-gray-400 hover:text-gray-600 font-bold"
            >
              Close
            </button>
          </div>

          {isLoadingDetails ? (
            <div className="text-gray-500 text-sm py-10 text-center">Loading details...</div>
          ) : proposalDetails ? (
            <div className="space-y-6">
              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Proposal Number</span>
                <span className="text-sm font-semibold text-gray-800">{proposalDetails.proposalNumber}</span>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Groom Candidate</span>
                <span className="text-sm font-medium text-gray-800 block">
                  {proposalDetails.groomProfile?.person?.firstName} {proposalDetails.groomProfile?.person?.lastName}
                </span>
                <span className="text-xs text-gray-400">ID: {proposalDetails.groomProfileId}</span>
              </div>

              <div>
                <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Bride Candidate</span>
                <span className="text-sm font-medium text-gray-800 block">
                  {proposalDetails.brideProfile?.person?.firstName} {proposalDetails.brideProfile?.person?.lastName}
                </span>
                <span className="text-xs text-gray-400">ID: {proposalDetails.brideProfileId}</span>
              </div>

              {proposalDetails.proposalNotes && (
                <div>
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Creator Notes</span>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100 mt-1">
                    {proposalDetails.proposalNotes}
                  </p>
                </div>
              )}

              {/* Status Action Buttons */}
              {proposalDetails.proposalStatus === 'SENT' && (
                <div className="flex gap-x-3 pt-2">
                  <button
                    onClick={() => handleOpenActionModal('ACCEPT')}
                    className="flex-1 bg-green-600 text-white rounded px-3 py-2 text-sm font-semibold hover:bg-green-500 flex items-center justify-center gap-1"
                  >
                    <CheckIcon className="h-4 w-4" /> Accept
                  </button>
                  <button
                    onClick={() => handleOpenActionModal('REJECT')}
                    className="flex-1 bg-red-600 text-white rounded px-3 py-2 text-sm font-semibold hover:bg-red-500 flex items-center justify-center gap-1"
                  >
                    <XMarkIcon className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}

              {/* Activity Timeline */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" /> Activity History
                </h4>
                <div className="flow-root">
                  <ul role="list" className="-mb-8">
                    {proposalDetails.activities?.map((act: any, actIdx: number) => (
                      <li key={act.id}>
                        <div className="relative pb-8">
                          {actIdx !== proposalDetails.activities.length - 1 ? (
                            <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                act.activityType === 'CREATED' ? 'bg-blue-500 text-white' :
                                act.activityType === 'ACCEPTED' ? 'bg-green-500 text-white' :
                                act.activityType === 'REJECTED' ? 'bg-red-500 text-white' :
                                'bg-gray-400 text-white'
                              }`}>
                                {act.activityType.substring(0, 1)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-xs font-semibold text-gray-800">
                                  {act.activityType}{' '}
                                  {act.activityNotes && (
                                    <span className="font-normal text-gray-500 block mt-0.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                      {act.activityNotes}
                                    </span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right text-[10px] whitespace-nowrap text-gray-400">
                                {new Date(act.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Accept/Reject note dialog modal */}
      {actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {actionType === 'ACCEPT' ? 'Accept Proposal' : 'Reject Proposal'}
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Please provide decision notes or remarks for this action. This will be logged permanently in the audit trail.
            </p>

            <div className="mb-4">
              <label htmlFor="action-notes" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                id="action-notes"
                rows={3}
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                placeholder={actionType === 'ACCEPT' ? 'Add details like next step meeting...' : 'Add reason for rejection...'}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            {actionError && (
              <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {actionError}
              </div>
            )}

            <div className="flex justify-end gap-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setActionType(null);
                  setActionError(null);
                }}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAction}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none flex items-center justify-center min-w-[80px] ${
                  actionType === 'ACCEPT' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {acceptMutation.isPending || rejectMutation.isPending ? 'Saving...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
