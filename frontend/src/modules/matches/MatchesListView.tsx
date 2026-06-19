'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/modules/profiles/profile.service';
import { MatchService } from './match.service';
import { ProposalService } from '@/modules/proposals/proposal.service';
import { useAuthStore } from '@/modules/auth/auth.store';
import { CheckIcon, PlusIcon, InformationCircleIcon, EyeIcon } from '@heroicons/react/24/outline';
import api from '@/services/api';
import { SparklesIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';

function getNewExplanationStrengths(aiExplanation?: string): string[] {
  if (!aiExplanation) return [];
  const sections: Record<string, string> = {};
  const headers = ["WHY THIS MATCH", "STRENGTHS", "THINGS TO DISCUSS", "SUGGESTED FIRST DISCUSSION TOPICS"];
  
  let currentHeader = "";
  const lines = aiExplanation.split("\n");
  
  lines.forEach((line) => {
    const trimmed = line.trim();
    const matchedHeader = headers.find(h => trimmed === h);
    if (matchedHeader) {
      currentHeader = matchedHeader;
      sections[currentHeader] = "";
    } else if (currentHeader) {
      sections[currentHeader] += line + "\n";
    }
  });

  if (!sections["STRENGTHS"]) return [];
  return sections["STRENGTHS"]
    .trim()
    .split("\n")
    .map(s => s.trim().replace(/^-\s*/, ""))
    .filter(s => s.length > 0);
}

export default function MatchesListView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');

  // Proposal Modal State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalNotes, setProposalNotes] = useState('');
  const [targetCandidate, setTargetCandidate] = useState<any>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);

  // Why Match Modal State
  const [showWhyMatchModal, setShowWhyMatchModal] = useState(false);
  const [whyMatchCandidate, setWhyMatchCandidate] = useState<any>(null);
  const [detailedRecommendation, setDetailedRecommendation] = useState<any>(null);
  const [isLoadingRecommendation, setIsLoadingRecommendation] = useState(false);

  // 1. Fetch all profiles for target selector
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ['profiles'],
    queryFn: ProfileService.getProfiles,
  });

  // Filter out draft profiles for matchmaking selector
  const approvedProfiles = React.useMemo(() => {
    if (!profiles) return [];
    return profiles.filter((p: any) => p.status === 'ACTIVE');
  }, [profiles]);

  // Find currently selected target profile
  const targetProfile = React.useMemo(() => {
    if (!profiles || !selectedProfileId) return null;
    return profiles.find((p: any) => p.id === selectedProfileId);
  }, [profiles, selectedProfileId]);

  // 2. Fetch matches for selected profile
  const { data: matches, isLoading: isLoadingMatches, isError: isErrorMatches } = useQuery({
    queryKey: ['matches', selectedProfileId],
    queryFn: () => MatchService.searchMatches(selectedProfileId),
    enabled: !!selectedProfileId,
  });

  const { myAgencyMatches, partnerAgencyMatches } = React.useMemo(() => {
    if (!matches) return { myAgencyMatches: [], partnerAgencyMatches: [] };
    return {
      myAgencyMatches: matches.filter((m: any) => m.isOwnAgency),
      partnerAgencyMatches: matches.filter((m: any) => !m.isOwnAgency),
    };
  }, [matches]);

  // 3. Create Proposal Mutation
  const createProposalMutation = useMutation({
    mutationFn: async (payload: {
      senderAgencyId: string;
      receiverAgencyId: string;
      brideProfileId: string;
      groomProfileId: string;
      createdBy: string;
      proposalNotes?: string;
    }) => {
      return ProposalService.createProposal(payload);
    },
    onSuccess: () => {
      setShowProposalModal(false);
      setProposalNotes('');
      setTargetCandidate(null);
      setProposalError(null);
      alert('Match proposal sent successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create proposal';
      setProposalError(msg);
    }
  });

  const handleOpenProposalModal = async (candidate: any) => {
    setTargetCandidate(candidate);
    setShowProposalModal(true);
    setProposalError(null);
  };

  const handleOpenWhyMatchModal = async (candidate: any) => {
    setWhyMatchCandidate(candidate);
    setShowWhyMatchModal(true);
    setDetailedRecommendation(null);
    setIsLoadingRecommendation(true);
    try {
      const response = await api.get(`/matches/recommendation/${selectedProfileId}/${candidate.candidateId}`);
      if (response.data?.success) {
        setDetailedRecommendation(response.data.data);
      }
    } catch (err) {
      console.error("Failed to load detailed AI recommendation", err);
    } finally {
      setIsLoadingRecommendation(false);
    }
  };

  const handleSendProposal = async () => {
    if (!user || !targetProfile || !targetCandidate) return;

    try {
      setProposalError(null);
      // Fetch full candidate profile to get receiver's agency ID
      const fullCandidate = await ProfileService.getProfileById(targetCandidate.candidateId);
      if (!fullCandidate || !fullCandidate.agencyId) {
        setProposalError('Could not retrieve candidate agency details.');
        return;
      }

      // Determine bride/groom parameters
      const isTargetMale = targetProfile.gender === 'MALE';
      const brideProfileId = isTargetMale ? targetCandidate.candidateId : targetProfile.id;
      const groomProfileId = isTargetMale ? targetProfile.id : targetCandidate.candidateId;

      createProposalMutation.mutate({
        senderAgencyId: user.agencyId,
        receiverAgencyId: fullCandidate.agencyId,
        brideProfileId,
        groomProfileId,
        createdBy: user.id,
        proposalNotes: proposalNotes.trim() || undefined,
      });
    } catch (err: any) {
      setProposalError('Failed to verify candidate profiles. Please try again.');
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Match Discovery</h1>
      </div>

      {/* Target Profile Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <label htmlFor="target-profile" className="block text-sm font-medium text-gray-700 mb-2">
          Select Target Profile to Find Matches
        </label>
        <select
          id="target-profile"
          value={selectedProfileId}
          onChange={(e) => setSelectedProfileId(e.target.value)}
          className="block w-full sm:w-96 border border-gray-300 rounded-md px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        >
          <option value="">-- Choose a Profile --</option>
          {isLoadingProfiles ? (
            <option disabled>Loading profiles...</option>
          ) : (
            approvedProfiles.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.profileNumber} - {p.gender})
              </option>
            ))
          )}
        </select>
        {targetProfile && (
          <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-100 flex gap-x-8">
            <div><strong>Age:</strong> {targetProfile.age || 'N/A'}</div>
            <div><strong>City:</strong> {targetProfile.city || 'N/A'}</div>
            <div><strong>Religion:</strong> {targetProfile.personal?.religion || 'N/A'}</div>
            <div><strong>Marital Status:</strong> {targetProfile.maritalStatus || 'N/A'}</div>
          </div>
        )}
      </div>

      {/* Match Results list */}
      {selectedProfileId ? (
        <div className="space-y-10">
          {isLoadingMatches ? (
            <div className="text-center py-20 text-gray-500">Evaluating compatibilities...</div>
          ) : isErrorMatches ? (
            <div className="text-center py-20 text-red-650">Failed to evaluate matches. Check API health.</div>
          ) : matches && matches.length > 0 ? (
            <div className="space-y-10">
              {/* Section 1: My Agency Matches */}
              {myAgencyMatches.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-650"></span>
                    My Agency Matches ({myAgencyMatches.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {myAgencyMatches.map((match: any) => (
                      <div key={match.candidateId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{match.personName}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">ID: {match.candidateId.substring(0, 8)}...</p>
                              
                              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                                <div><strong>Age:</strong> {match.age || 'N/A'}</div>
                                <div><strong>City:</strong> {match.city || 'N/A'}</div>
                                <div><strong>Religion:</strong> {match.religion || 'N/A'}</div>
                                <div><strong>Education:</strong> {match.education || 'N/A'}</div>
                                <div className="col-span-2"><strong>Occupation:</strong> {match.profession || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-y-1">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                match.finalScore >= 90 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                match.finalScore >= 80 ? 'bg-green-100 text-green-800' :
                                match.finalScore >= 60 ? 'bg-blue-100 text-blue-800' :
                                match.finalScore >= 45 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-805'
                              }`}>
                                {match.finalScore >= 90 ? 'Exceptional' : 
                                 match.finalScore >= 80 ? 'Strong' : 
                                 match.finalScore >= 60 ? 'Good' : 
                                 match.finalScore >= 45 ? 'Fair' : 
                                 'Low Match'} ({match.finalScore}%)
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Strengths Highlight</h4>
                            <div className="flex flex-col gap-y-1.5">
                              {(() => {
                                const newStrengths = getNewExplanationStrengths(match.aiExplanation).slice(0, 4);
                                if (newStrengths.length > 0) {
                                  return newStrengths.map((r: string, idx: number) => (
                                    <div key={idx} className="inline-flex items-center self-start px-2.5 py-1 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                      <span className="mr-1.5 font-bold">✓</span>
                                      <span className="leading-tight">{r}</span>
                                    </div>
                                  ));
                                }
                                return <span className="text-xs text-gray-400 italic">No specific questionnaire alignment factors.</span>;
                              })()}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            Weighted Compatibility Engine V1
                          </div>
                          <div className="flex gap-x-2">
                            <Link
                              href={`/dashboard/profiles/${match.candidateId}`}
                              target="_blank"
                              className="inline-flex items-center gap-x-1.5 rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                              <EyeIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                              View Profile
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleOpenWhyMatchModal(match)}
                              className="inline-flex items-center gap-x-1.5 rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
                            >
                              Why Match
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenProposalModal(match)}
                              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                              <PlusIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                              Send Proposal
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Partner Agency Matches */}
              {partnerAgencyMatches.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2 flex items-center gap-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    Partner Agency Matches ({partnerAgencyMatches.length})
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {partnerAgencyMatches.map((match: any) => (
                      <div key={match.candidateId} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">{match.personName}</h3>
                              <p className="text-xs text-gray-500 mt-0.5">ID: {match.candidateId.substring(0, 8)}...</p>
                              
                              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-md border border-gray-100">
                                <div><strong>Age:</strong> {match.age || 'N/A'}</div>
                                <div><strong>City:</strong> {match.city || 'N/A'}</div>
                                <div><strong>Religion:</strong> {match.religion || 'N/A'}</div>
                                <div><strong>Education:</strong> {match.education || 'N/A'}</div>
                                <div className="col-span-2"><strong>Occupation:</strong> {match.profession || 'N/A'}</div>
                              </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-y-1">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                match.finalScore >= 90 ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                match.finalScore >= 80 ? 'bg-green-100 text-green-800' :
                                match.finalScore >= 60 ? 'bg-blue-100 text-blue-800' :
                                match.finalScore >= 45 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-805'
                              }`}>
                                {match.finalScore >= 90 ? 'Exceptional' : 
                                 match.finalScore >= 80 ? 'Strong' : 
                                 match.finalScore >= 60 ? 'Good' : 
                                 match.finalScore >= 45 ? 'Fair' : 
                                 'Low Match'} ({match.finalScore}%)
                              </span>
                            </div>
                          </div>

                          <div className="border-t border-gray-100 pt-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Strengths Highlight</h4>
                            <div className="flex flex-col gap-y-1.5">
                              <span className="text-xs text-gray-400 italic">Hidden until proposal acceptance.</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="text-xs text-gray-400">
                            Weighted Compatibility Engine V1
                          </div>
                          <div className="flex gap-x-2">
                            {match.showFullDetails ? (
                              <Link
                                href={`/dashboard/profiles/${match.candidateId}`}
                                target="_blank"
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                              >
                                <EyeIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                                View Profile
                              </Link>
                            ) : (
                              <span className="inline-flex items-center rounded-md bg-gray-100 border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-400 cursor-not-allowed">
                                Profile Masked
                              </span>
                            )}
                            {match.showFullDetails && (
                              <button
                                type="button"
                                onClick={() => handleOpenWhyMatchModal(match)}
                                className="inline-flex items-center gap-x-1.5 rounded-md bg-white border border-gray-300 px-3 py-1.5 text-xs font-semibold text-indigo-650 shadow-sm hover:bg-indigo-50"
                              >
                                Why Match
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenProposalModal(match)}
                              className="inline-flex items-center gap-x-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500"
                            >
                              <PlusIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                              Send Proposal
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 bg-white rounded-lg border border-gray-200">
              No matching profiles found in the database.
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-400 bg-white rounded-lg border border-gray-200">
          <InformationCircleIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          Choose a target profile above to search matches.
        </div>
      )}

      {/* Why Match Explanation Modal */}
      {showWhyMatchModal && whyMatchCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[85vh] overflow-y-auto">
             <div className="flex justify-between items-center mb-4 pb-2 border-b">
              <h2 className="text-xl font-bold text-gray-900">Why Match?</h2>
              <div className="flex gap-x-2">
                {whyMatchCandidate.confidenceScore !== undefined && whyMatchCandidate.confidenceScore !== null && (
                  <span className="text-sm font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                    Confidence: {whyMatchCandidate.confidenceScore}%
                  </span>
                )}
                <span className="text-sm font-extrabold text-indigo-650 bg-indigo-50 px-3 py-1 rounded-full">
                  Final Score: {whyMatchCandidate.finalScore}%
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-4">
              Detailed Compatibility Breakdown for <strong>{whyMatchCandidate.personName}</strong>
            </p>

            {whyMatchCandidate.confidenceScore !== undefined && whyMatchCandidate.confidenceScore !== null && whyMatchCandidate.confidenceScore < 50 && (
              <div className="mb-4 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded px-3 py-2 flex items-center gap-1.5">
                ⚠ Limited questionnaire data available. Match confidence is low.
              </div>
            )}

            {whyMatchCandidate.aiSummary && (
              <div className="mb-4 p-4 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 rounded-lg border border-indigo-200">
                <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Candidate AI Summary</h4>
                <p className="text-xs text-gray-750 leading-relaxed italic">
                  "{whyMatchCandidate.aiSummary}"
                </p>
              </div>
            )}

            {(detailedRecommendation?.aiExplanation || whyMatchCandidate.aiExplanation) && (
              <div className="mb-6 p-4 bg-indigo-50/30 rounded-lg border border-indigo-100">
                {(() => {
                  const text = detailedRecommendation?.aiExplanation || whyMatchCandidate.aiExplanation;
                  if (!text.includes("WHY THIS MATCH") && !text.includes("STRENGTHS")) {
                    return (
                      <>
                        <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">AI Compatibility Summary</h4>
                        <p className="text-xs text-gray-750 leading-relaxed italic">
                          "{text}"
                        </p>
                      </>
                    );
                  }

                  const sections: Record<string, string> = {};
                  const headers = ["WHY THIS MATCH", "STRENGTHS", "THINGS TO DISCUSS", "SUGGESTED FIRST DISCUSSION TOPICS"];
                  
                  let currentHeader = "";
                  const lines = text.split("\n");
                  
                  lines.forEach((line: string) => {
                    const trimmed = line.trim();
                    const matchedHeader = headers.find(h => trimmed === h);
                    if (matchedHeader) {
                      currentHeader = matchedHeader;
                      sections[currentHeader] = "";
                    } else if (currentHeader) {
                      sections[currentHeader] += line + "\n";
                    }
                  });

                  return (
                    <div className="space-y-4">
                      {sections["WHY THIS MATCH"] && (
                        <div>
                          <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Why This Match</h4>
                          <p className="text-xs text-gray-700 leading-relaxed">{sections["WHY THIS MATCH"].trim()}</p>
                        </div>
                      )}
                      {sections["STRENGTHS"] && (
                        <div className="pt-2.5 border-t border-indigo-100">
                          <h4 className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-1.5">Matched Strengths</h4>
                          <ul className="space-y-1 text-xs text-gray-750">
                            {sections["STRENGTHS"].trim().split("\n").filter((s: string) => s.trim().length > 0).map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-green-500 font-bold">✓</span>
                                <span>{s.replace(/^-\s*/, "")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {sections["THINGS TO DISCUSS"] && (
                        <div className="pt-2.5 border-t border-indigo-100">
                          <h4 className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">Things to Discuss</h4>
                          {sections["THINGS TO DISCUSS"].trim().toLowerCase().includes("no major compatibility concerns") ? (
                            <p className="text-xs text-gray-450 italic">No major compatibility concerns identified.</p>
                          ) : (
                            <ul className="space-y-1 text-xs text-gray-755">
                              {sections["THINGS TO DISCUSS"].trim().split("\n").filter((s: string) => s.trim().length > 0).map((s: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-amber-650 font-bold">⚠</span>
                                  <span>{s.replace(/^-\s*/, "")}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                      {sections["SUGGESTED FIRST DISCUSSION TOPICS"] && (
                        <div className={`pt-2.5 border-t border-indigo-100 bg-indigo-50/20 -mx-4 p-4 ${
                          whyMatchCandidate.conversationStarters && whyMatchCandidate.conversationStarters.length > 0
                            ? 'border-b'
                            : '-mb-4 rounded-b-lg'
                        }`}>
                          <h4 className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1.5">Suggested First Discussion Topics</h4>
                          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-900 font-medium">
                            {sections["SUGGESTED FIRST DISCUSSION TOPICS"].trim().split("\n").filter((s: string) => s.trim().length > 0).map((s: string, i: number) => (
                              <li key={i} className="bg-indigo-50/50 border border-indigo-100 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                                <span className="text-indigo-450 font-bold">•</span>
                                <span>{s.replace(/^-\s*/, "").replace(/^\d+\.\s*/, "")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {whyMatchCandidate.conversationStarters && whyMatchCandidate.conversationStarters.length > 0 && (
                        <div className="pt-3 border-t border-indigo-100 bg-purple-50/20 -mx-4 -mb-4 p-4 rounded-b-lg">
                          <h4 className="text-[11px] font-bold text-purple-700 uppercase tracking-wider mb-2">Conversation Starters</h4>
                          <div className="space-y-2.5">
                            {whyMatchCandidate.conversationStarters.slice(0, 3).map((starter: string, i: number) => (
                              <div key={i} className="bg-white border border-purple-100 rounded-lg p-3 shadow-sm hover:border-purple-200 transition-colors flex gap-2.5 items-start">
                                <span className="text-purple-500 font-extrabold text-xs bg-purple-50 px-1.5 py-0.5 rounded leading-none">
                                  {i + 1}
                                </span>
                                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                  {starter}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
            {/* Proposal Recommendation Widget */}
            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-150 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Proposal Recommendation</h3>
                {isLoadingRecommendation && (
                  <span className="inline-flex items-center gap-x-1 text-[10px] text-gray-400">
                    <svg className="animate-spin h-3.5 w-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyzing...</span>
                  </span>
                )}
              </div>
              
              {(() => {
                const rec = detailedRecommendation || whyMatchCandidate.proposalRecommendation;
                if (!rec) return <span className="text-xs text-gray-400 italic">No recommendation generated.</span>;

                let levelLabel = "Needs Discussion";
                let levelColor = "bg-amber-50 text-amber-800 border-amber-200";
                if (rec.recommendationLevel === "STRONGLY_RECOMMENDED") {
                  levelLabel = "Strongly Recommended 🌟";
                  levelColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
                } else if (rec.recommendationLevel === "RECOMMENDED") {
                  levelLabel = "Recommended 👍";
                  levelColor = "bg-indigo-50 text-indigo-800 border-indigo-200";
                } else if (rec.recommendationLevel === "NEEDS_DISCUSSION") {
                  levelLabel = "Needs Discussion 💬";
                  levelColor = "bg-amber-50 text-amber-800 border-amber-200";
                } else if (rec.recommendationLevel === "NOT_RECOMMENDED") {
                  levelLabel = "Not Recommended ⚠️";
                  levelColor = "bg-rose-50 text-rose-800 border-rose-200";
                }

                return (
                  <div className="space-y-4">
                    {/* Level and successProbability */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-y-3 pb-3 border-b border-gray-100">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${levelColor}`}>
                        {levelLabel}
                      </span>
                      <div className="w-full sm:w-1/2 flex items-center gap-x-2">
                        <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">Success Probability:</span>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                           <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${rec.successProbability}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-800">{rec.successProbability}%</span>
                      </div>
                    </div>

                    {/* Summary */}
                    <p className="text-xs text-gray-755 leading-relaxed font-medium">
                      {rec.recommendationSummary}
                    </p>

                    {/* Strengths & Risks */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {rec.strengths && rec.strengths.length > 0 && (
                        <div>
                          <span className="block text-[10px] text-green-700 uppercase font-bold tracking-wider mb-2">Rec Strengths</span>
                          <ul className="space-y-1.5 text-xs text-gray-650">
                            {rec.strengths.map((str: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-green-500 font-bold">✓</span>
                                <span className="leading-tight">{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {rec.risks && rec.risks.length > 0 && (
                        <div>
                          <span className="block text-[10px] text-rose-700 uppercase font-bold tracking-wider mb-2">Rec Risks / Concerns</span>
                          <ul className="space-y-1.5 text-xs text-gray-650">
                            {rec.risks.map((risk: string, i: number) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-rose-500 font-bold">!</span>
                                <span className="leading-tight">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Score Breakdown */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Score Breakdown</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Mutual Preferences (40%)</span>
                  <div className="flex justify-between items-baseline">
                    <strong className="text-gray-900 text-lg">{whyMatchCandidate.filterScore}%</strong>
                    <span className="text-[10px] text-gray-400 font-medium">(Mutual Average)</span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-gray-200 grid grid-cols-2 gap-x-4 text-[11px] text-gray-650">
                    <div>You match their preferences: <strong className="text-gray-800">{whyMatchCandidate.targetToSourcePrefScore ?? whyMatchCandidate.filterScore}%</strong></div>
                    <div>They match your preferences: <strong className="text-gray-800">{whyMatchCandidate.sourceToTargetPrefScore ?? whyMatchCandidate.filterScore}%</strong></div>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Questionnaire (40%)</span>
                  <strong className="text-gray-900 text-base">{whyMatchCandidate.compatibilityScore}%</strong>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100">
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Lifestyle (10%)</span>
                  <strong className="text-gray-900 text-base">{whyMatchCandidate.lifestyleScore}%</strong>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-100 col-span-2">
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold">Edu & Career (10%)</span>
                  <strong className="text-gray-900 text-sm block">
                    {whyMatchCandidate.educationCareerScore !== null && whyMatchCandidate.educationCareerScore !== undefined
                      ? `${whyMatchCandidate.educationCareerScore}%`
                      : "Insufficient Data"}
                  </strong>
                </div>
              </div>
            </div>

            {/* Traits Comparison */}
            <div className="mb-6">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Traits Comparison</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
                {[
                  { name: "Communication", key: "communicationScore" },
                  { name: "Family Orientation", key: "familyScore" },
                  { name: "Career Focus", key: "careerScore" },
                  { name: "Financial Saving", key: "financialScore" },
                  { name: "Lifestyle Focus", key: "lifestyleScore" },
                  { name: "Emotional Maturity", key: "emotionalScore" },
                  { name: "Traditional Values", key: "traditionalScore" },
                  { name: "Parenting Expectation", key: "parentingScore" },
                  { name: "Independence", key: "independenceScore" }
                ].map(trait => {
                  const targetVal = whyMatchCandidate.targetTraits?.[trait.key] ?? 5;
                  const candidateVal = whyMatchCandidate.traits?.[trait.key] ?? 5;
                  return (
                    <div key={trait.key} className="flex justify-between items-center border-b pb-1">
                      <span className="text-gray-600 font-medium">{trait.name}</span>
                      <div className="flex gap-x-3">
                        <span className="text-gray-500">You: <strong>{targetVal}/10</strong></span>
                        <span className="text-indigo-650">Them: <strong>{candidateVal}/10</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end mt-6 pt-3 border-t">
              <button
                type="button"
                onClick={() => {
                  setShowWhyMatchModal(false);
                  setWhyMatchCandidate(null);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-500 focus:outline-none"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Proposal Modal */}
      {showProposalModal && targetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Send Match Connection</h2>
            
            <p className="text-sm text-gray-600 mb-4">
              You are sending a marriage match proposal between <strong>{targetProfile?.firstName}</strong> and <strong>{targetCandidate.personName}</strong>. This will notify their respective matching agency.
            </p>

            <div className="mb-4">
              <label htmlFor="proposal-notes" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Proposal Notes / Remarks
              </label>
              <textarea
                id="proposal-notes"
                rows={4}
                value={proposalNotes}
                onChange={(e) => setProposalNotes(e.target.value)}
                placeholder="Write an introductory note for this connection..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            {proposalError && (
              <div className="mb-4 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                {proposalError}
              </div>
            )}

            <div className="flex justify-end gap-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowProposalModal(false);
                  setProposalError(null);
                }}
                disabled={createProposalMutation.isPending}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendProposal}
                disabled={createProposalMutation.isPending}
                className="px-4 py-2 bg-indigo-600 rounded-md text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none flex items-center justify-center min-w-[80px]"
              >
                {createProposalMutation.isPending ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
