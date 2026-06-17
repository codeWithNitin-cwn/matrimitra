'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProposalService } from '@/services/proposal.service';
import { PipelineService } from '@/services/pipeline.service';
import { useAuthStore } from '@/store/auth.store';
import { CheckIcon, CalendarIcon, UserIcon, ArrowRightIcon, ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PIPELINE_STAGES = [
  { key: 'NEW_PROPOSAL', label: 'Proposal Sent' },
  { key: 'PROFILE_SHARED', label: 'Profile Shared' },
  { key: 'INTERESTED', label: 'Mutual Interest' },
  { key: 'MEETING_SCHEDULED', label: 'Meeting Scheduled' },
  { key: 'FAMILY_DISCUSSION', label: 'Family Discussion' },
  { key: 'ENGAGEMENT', label: 'Engagement' },
  { key: 'MARRIED', label: 'Married 🎊' },
  { key: 'CLOSED', label: 'Closed/Withdrawn' },
];

export default function PipelinePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  
  // Transition Notes Modal states
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [pendingStage, setPendingStage] = useState('');
  const [transitionNotes, setTransitionNotes] = useState('');

  // 1. Fetch proposals
  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ['proposals'],
    queryFn: ProposalService.getProposals,
  });

  // Filter to only accepted proposals (as they qualify for pipeline tracking)
  const acceptedProposals = React.useMemo(() => {
    if (!proposals) return [];
    return proposals.filter((p: any) => p.proposalStatus === 'ACCEPTED');
  }, [proposals]);

  const selectedProposal = React.useMemo(() => {
    if (!acceptedProposals || !selectedProposalId) return null;
    return acceptedProposals.find((p: any) => p.id === selectedProposalId);
  }, [acceptedProposals, selectedProposalId]);

  // 2. Fetch pipeline details for the chosen proposal
  const { data: pipeline, isLoading: isLoadingPipeline, isError: isErrorPipeline } = useQuery({
    queryKey: ['pipeline', selectedProposalId],
    queryFn: () => PipelineService.getPipelineByProposal(selectedProposalId),
    enabled: !!selectedProposalId,
    retry: false, // If 404, we want to handle it ourselves
  });

  const [runAI, setRunAI] = useState(false);

  React.useEffect(() => {
    setRunAI(false);
  }, [selectedProposalId]);

  const { data: assistant, isLoading: isLoadingAssistant } = useQuery({
    queryKey: ['pipelineAssistant', selectedProposalId, pipeline?.currentStage, runAI],
    queryFn: () => PipelineService.getPipelineAssistant(selectedProposalId, runAI),
    enabled: !!selectedProposalId && !!pipeline,
  });

  // 3. Initialize Pipeline Mutation
  const initMutation = useMutation({
    mutationFn: (proposalId: string) => {
      return PipelineService.initializePipeline({
        proposalId,
        currentStage: 'PROFILE_SHARED',
        updatedBy: user!.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      alert('Pipeline initialized successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || err.message || 'Failed to initialize pipeline.');
    }
  });

  // 4. Update Stage Mutation
  const updateMutation = useMutation({
    mutationFn: ({ stage, notes }: { stage: string; notes?: string }) => {
      return PipelineService.updatePipelineStage(selectedProposalId, {
        currentStage: stage,
        updatedBy: user!.id,
        notes: notes?.trim() || undefined,
      });
    },
    onSuccess: () => {
      setShowNotesModal(false);
      setPendingStage('');
      setTransitionNotes('');
      queryClient.invalidateQueries({ queryKey: ['pipeline', selectedProposalId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      alert('Pipeline stage updated successfully!');
    },
    onError: (err: any) => {
      alert(err.response?.data?.error?.message || err.message || 'Failed to update pipeline stage.');
    }
  });

  const handleInitialize = () => {
    if (!selectedProposalId) return;
    initMutation.mutate(selectedProposalId);
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stage = e.target.value;
    if (!stage) return;
    setPendingStage(stage);
    setTransitionNotes('');
    setShowNotesModal(true);
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Pipeline Tracker</h1>
      </div>

      {/* Select Accepted Proposal */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <label htmlFor="pipeline-proposal" className="block text-sm font-medium text-gray-700 mb-2">
          Select Accepted Match to Track
        </label>
        <select
          id="pipeline-proposal"
          value={selectedProposalId}
          onChange={(e) => setSelectedProposalId(e.target.value)}
          className="block w-full sm:w-96 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        >
          <option value="">-- Select a Proposal --</option>
          {isLoadingProposals ? (
            <option disabled>Loading proposals...</option>
          ) : (
            acceptedProposals.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.proposalNumber} (ID: {p.id.substring(0, 8)}...)
              </option>
            ))
          )}
        </select>
        {selectedProposal && (
          <div className="mt-4 flex flex-col sm:flex-row gap-6 bg-gray-50 p-4 rounded-md border border-gray-100 text-sm text-gray-600">
            <div>
              <strong>Bride Candidate ID:</strong> {selectedProposal.brideProfileId}
            </div>
            <div>
              <strong>Groom Candidate ID:</strong> {selectedProposal.groomProfileId}
            </div>
          </div>
        )}
      </div>

      {/* Pipeline Stages Render */}
      {selectedProposalId ? (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {isLoadingPipeline ? (
            <div className="text-center py-12 text-gray-500">Querying pipeline state...</div>
          ) : isErrorPipeline || !pipeline ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">Pipeline has not been initialized for this connection yet.</p>
              <button
                onClick={handleInitialize}
                disabled={initMutation.isPending}
                className="bg-indigo-600 text-white font-semibold rounded px-4 py-2 hover:bg-indigo-500 disabled:bg-indigo-300"
              >
                {initMutation.isPending ? 'Initializing...' : 'Start Pipeline Tracking'}
              </button>
            </div>
          ) : (
            <div>
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Current Stage</h3>
                  <p className="text-xs text-gray-500">Last updated: {new Date(pipeline.stageDate).toLocaleDateString()} {new Date(pipeline.stageDate).toLocaleTimeString()}</p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <label htmlFor="stage-selector" className="sr-only">Change Stage</label>
                  <select
                    id="stage-selector"
                    value={pipeline.currentStage}
                    onChange={handleStageChange}
                    disabled={updateMutation.isPending}
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm font-semibold focus:outline-none text-gray-900"
                  >
                    {PIPELINE_STAGES.map((st) => (
                      <option key={st.key} value={st.key}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Pipeline Assistant Card */}
              <div className="mb-6 p-5 rounded-xl border border-indigo-150 bg-indigo-50/25 shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-x-2">
                    <SparklesIcon className="h-4 w-4 text-indigo-500 animate-pulse" /> AI Pipeline Assistant V1
                  </h4>
                  {assistant && (
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      assistant.riskLevel === 'HIGH' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                      assistant.riskLevel === 'MEDIUM' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                      'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      {assistant.riskLevel} RISK ({assistant.daysInStage} days in stage)
                    </span>
                  )}
                </div>

                {isLoadingAssistant ? (
                  <div className="text-xs text-gray-550 italic animate-pulse">Loading assistant recommendations...</div>
                ) : assistant ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-800 leading-relaxed">
                      <strong>Next Action Recommendation:</strong> {assistant.nextAction}
                    </div>
                    
                    <div className="text-xs text-gray-750 bg-white/70 border border-gray-150 rounded-lg p-3">
                      <div className="font-bold text-[10px] text-gray-400 uppercase tracking-wider mb-1">Suggested Message</div>
                      <p className="italic text-gray-850">"{assistant.suggestedMessage}"</p>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(assistant.suggestedMessage);
                          alert("Suggested message copied to clipboard!");
                        }}
                        className="mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-x-1"
                      >
                        Copy Message
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-x-6 gap-y-1 text-xs text-gray-550 pt-1">
                      <div>
                        <strong>Expected Next Stage:</strong> <span className="text-indigo-600 font-semibold">{
                          PIPELINE_STAGES.find(s => s.key === assistant.expectedNextStage)?.label || assistant.expectedNextStage
                        }</span>
                      </div>
                      {assistant.compatibilityScore > 0 && (
                        <div>
                          <strong>Match Compatibility Score:</strong> <span className="text-pink-650 font-bold">{assistant.compatibilityScore}%</span>
                        </div>
                      )}
                    </div>

                    {!runAI && (
                      <div className="mt-4 pt-3 border-t border-indigo-100/50 flex justify-end">
                        <button
                          onClick={() => setRunAI(true)}
                          className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded px-3.5 py-1.5 transition flex items-center gap-x-1"
                        >
                          <SparklesIcon className="h-3.5 w-3.5" /> Generate AI Insight
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-red-500">Failed to load recommendations.</div>
                )}
              </div>

              {/* Steps Progress Indicator */}
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-8 gap-4">
                {PIPELINE_STAGES.map((st, index) => {
                  const isActive = pipeline.currentStage === st.key;
                  // Index of current active stage
                  const activeIndex = PIPELINE_STAGES.findIndex(s => s.key === pipeline.currentStage);
                  const isCompleted = index <= activeIndex;

                  return (
                    <div
                      key={st.key}
                      className={`p-4 rounded-lg border flex flex-col items-center justify-between min-h-[100px] text-center ${
                        isActive ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20' :
                        isCompleted ? 'bg-green-50/50 border-green-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? 'bg-indigo-600 text-white' :
                        isCompleted ? 'bg-green-500 text-white' :
                        'bg-gray-300 text-gray-600'
                      }`}>
                        {index + 1}
                      </span>
                      <span className={`text-xs font-semibold mt-3 ${
                        isActive ? 'text-indigo-900' :
                        isCompleted ? 'text-green-800' :
                        'text-gray-500'
                      }`}>
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Audit Timeline */}
              {pipeline.history && pipeline.history.length > 0 && (
                <div className="mt-12 border-t border-gray-100 pt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ClockIcon className="h-5 w-5 text-gray-500" /> Pipeline Stage Audit History
                  </h3>
                  <div className="flow-root">
                    <ul role="list" className="-mb-8">
                      {pipeline.history.map((item: any, itemIdx: number) => {
                        const fromStageLabel = PIPELINE_STAGES.find(s => s.key === item.oldStage)?.label || item.oldStage;
                        const toStageLabel = PIPELINE_STAGES.find(s => s.key === item.newStage)?.label || item.newStage;
                        return (
                          <li key={item.id}>
                            <div className="relative pb-8">
                              {itemIdx !== pipeline.history.length - 1 ? (
                                <span className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                              ) : null}
                              <div className="relative flex space-x-3">
                                <div>
                                  <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                    item.oldStage === 'NONE' ? 'bg-blue-500 text-white' : 'bg-indigo-500 text-white'
                                  }`}>
                                    {item.oldStage === 'NONE' ? 'I' : 'T'}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <div className="text-sm font-semibold text-gray-800 flex items-center gap-2 flex-wrap">
                                      {item.oldStage === 'NONE' ? (
                                        <span>Pipeline initialized at <span className="text-indigo-600 font-bold">{toStageLabel}</span></span>
                                      ) : (
                                        <>
                                          <span className="text-gray-500 line-through">{fromStageLabel}</span>
                                          <ArrowRightIcon className="h-3.5 w-3.5 text-gray-400" />
                                          <span className="text-indigo-600 font-bold">{toStageLabel}</span>
                                        </>
                                      )}
                                    </div>
                                    {item.notes && (
                                      <p className="mt-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-md p-2 max-w-2xl">
                                        {item.notes}
                                      </p>
                                    )}
                                    <p className="mt-1 text-[11px] text-gray-400">
                                      Changed by User: {item.changedBy}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs whitespace-nowrap text-gray-400">
                                    {new Date(item.changedAt).toLocaleDateString()} {new Date(item.changedAt).toLocaleTimeString()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-gray-200">
          Please select an accepted proposal from the dropdown menu to manage its relation pipeline.
        </div>
      )}

      {/* Stage Change Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Confirm Stage Transition
            </h2>
            
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to transition this pipeline to <strong>{PIPELINE_STAGES.find(s => s.key === pendingStage)?.label}</strong>? You can add optional notes or remarks for this update below.
            </p>

            <div className="mb-4">
              <label htmlFor="transition-notes" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Transition Notes (Optional)
              </label>
              <textarea
                id="transition-notes"
                rows={3}
                value={transitionNotes}
                onChange={(e) => setTransitionNotes(e.target.value)}
                placeholder="Add optional details about this stage transition..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            <div className="flex justify-end gap-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowNotesModal(false);
                  setPendingStage('');
                  setTransitionNotes('');
                }}
                disabled={updateMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateMutation.mutate({ stage: pendingStage, notes: transitionNotes })}
                disabled={updateMutation.isPending}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-md text-sm font-medium text-white focus:outline-none flex items-center justify-center min-w-[80px]"
              >
                {updateMutation.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
