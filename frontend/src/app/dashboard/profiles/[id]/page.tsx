'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/modules/profiles/profile.service';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

function formatRelativeTime(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);

  if (diffSec < 60) {
    return "just now";
  } else if (diffMin < 60) {
    return `${diffMin} ${diffMin === 1 ? 'min' : 'mins'} ago`;
  } else if (diffHr < 24) {
    return `${diffHr} ${diffHr === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffDays === 1) {
    return "yesterday";
  } else {
    return `${diffDays} days ago`;
  }
}

function getInitials(name: string) {
  if (!name) return '??';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function ViewProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();
  const [agencyFilter, setAgencyFilter] = useState("ALL");

  const { data: profile, isPending, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ProfileService.getProfileById(id),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: string; reason?: string }) => 
      ProfileService.updateStatus(id, status, reason),
    onSuccess: (res, variables) => {
      toast.success(`Profile status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update status.';
      toast.error(message);
    },
  });

  const generateOnboardingMutation = useMutation({
    mutationFn: () => ProfileService.generateOnboardingLink(id),
    onSuccess: () => {
      toast.success('Onboarding link generated!');
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to generate link.';
      toast.error(message);
    }
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'ACTIVE' });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: 'DRAFT' });
  };

  const handleRequestCorrections = () => {
    const reason = prompt("Please enter the reason for requesting corrections:");
    if (reason === null) return;
    updateStatusMutation.mutate({ status: 'CORRECTION_REQUESTED', reason });
  };

  if (isPending) {
    return <div className="p-8 text-gray-600">Loading profile details...</div>;
  }

  if (isError || !profile) {
    return (
      <div className="p-8 text-red-600">
        Error loading profile. <Link href="/dashboard/profiles" className="underline">Go back</Link>.
      </div>
    );
  }

  // Resolve primary photo and log it
  const primaryPhoto = profile?.photos?.find((p: any) => p.isPrimary);
  const rawUrl = primaryPhoto?.cloudinaryUrl;
  let photoUrl = '';
  if (rawUrl) {
    if (rawUrl === 'mock_photo_primary.png') {
      photoUrl = profile?.person?.gender?.toUpperCase() === 'FEMALE'
        ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    } else if (rawUrl.startsWith('http')) {
      photoUrl = rawUrl;
    } else {
      photoUrl = `http://localhost:5000${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
  } else {
    photoUrl = profile?.person?.gender?.toUpperCase() === 'FEMALE'
      ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
      : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
  }


  // Format height from Cm back to Ft/In if possible
  const formatHeight = (heightCm: number | undefined | null) => {
    if (!heightCm) return 'N/A';
    const totalInches = heightCm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return `${feet}' ${inches}" (${heightCm} cm)`;
  };

  const getFamilyDetails = () => {
    const rawFamilyType = profile.families?.[0]?.familyType || '';
    const parts = rawFamilyType.split(' | Remarks: ');
    return {
      familyType: parts[0] || 'N/A',
      siblingsRemarks: parts[1] || 'N/A'
    };
  };
  const { familyType, siblingsRemarks } = getFamilyDetails();

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4 sm:px-6 lg:px-8">
      {/* Navigation & Actions */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/profiles" className="text-gray-500 hover:text-gray-900">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {profile.person?.firstName} {profile.person?.lastName}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Profile ID: {profile.profileNumber} • Rel: {profile.relationshipToClient || 'N/A'}</p>
          </div>
          <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
            profile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            profile.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-805'
          }`}>
            {profile.status}
          </span>
        </div>
        
        <div className="flex items-center gap-x-3">
          <Link
            href={`/dashboard/profiles/${id}/edit`}
            className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Edit Profile
          </Link>
          {profile.status !== 'ACTIVE' && (
            <button
              onClick={handleApprove}
              disabled={updateStatusMutation.isPending}
              className="inline-flex items-center justify-center rounded-md bg-indigo-650 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:opacity-50 hover:cursor-pointer"
            >
              {profile.status === 'CLIENT_UPDATED' ? 'Approve Changes & Activate' : 'Approve & Activate'}
            </button>
          )}
          {profile.status !== 'CORRECTION_REQUESTED' && profile.status !== 'DRAFT' && profile.status !== 'ACTIVE' && (
            <button
              onClick={handleRequestCorrections}
              disabled={updateStatusMutation.isPending}
              className="inline-flex items-center justify-center rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 hover:cursor-pointer"
            >
              Request Corrections
            </button>
          )}
          {profile.status !== 'DRAFT' && (
            <button
              onClick={handleReject}
              disabled={updateStatusMutation.isPending}
              className="inline-flex items-center justify-center rounded-md bg-red-650 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50 hover:cursor-pointer"
            >
              Revert to Draft
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Core Profile Cards */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: AI Profile Summary */}
          {profile.aiSummary && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 shadow rounded-lg overflow-hidden border border-indigo-200">
              <div className="px-5 py-4 border-b border-indigo-100 bg-indigo-50/30 flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-900">AI Profile Summary</h3>
                <span className="inline-flex items-center rounded-md bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                  AI Generated
                </span>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-gray-800 leading-relaxed italic">
                  "{profile.aiSummary}"
                </p>
              </div>
            </div>
          )}

          {/* Section: Personal Details */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Personal Details</h3>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Gender</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.person?.gender || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.person?.dob ? new Date(profile.person.dob).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Religion</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.personal?.religion || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Caste / Sub-Caste</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.personal?.caste || 'N/A'} {profile.personal?.subCaste ? `(${profile.personal.subCaste})` : ''}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mother Tongue</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.personal?.motherTongue || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Marital Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.personal?.maritalStatus || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Height</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatHeight(profile.personal?.heightCm)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Weight</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.personal?.weightKg ? `${profile.personal.weightKg} kg` : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {[profile.personal?.city, profile.personal?.state, profile.personal?.country].filter(Boolean).join(', ') || 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section: Education & Career */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Education & Professional Details</h3>
            </div>
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">Education</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 mb-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Degree / Qualification</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.educations?.[0]?.qualification || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Specialization</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.educations?.[0]?.specialization || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Institution / College</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.educations?.[0]?.institution || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Graduation Year</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.educations?.[0]?.graduationYear || 'N/A'}</dd>
                </div>
              </dl>

              <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3 border-t pt-4">Career</h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Occupation / Profession</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.careers?.[0]?.profession || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Designation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.careers?.[0]?.designation || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Employer / Company</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.careers?.[0]?.employer || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {profile.careers?.[0]?.annualIncome ? `₹ ${parseFloat(profile.careers[0].annualIncome).toLocaleString('en-IN')}` : 'N/A'}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Work Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.careers?.[0]?.workLocation || 'N/A'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section: Family Background */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Family Background</h3>
            </div>
            <div className="px-6 py-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Father's Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.fatherName || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Father's Occupation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.fatherOccupation || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mother's Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.motherName || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Mother's Occupation</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.motherOccupation || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Family Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{familyType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Family Values</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.familyValues || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Siblings Count</dt>
                  <dd className="mt-1 text-sm text-gray-900">{profile.families?.[0]?.siblingsCount ?? 'N/A'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Siblings Remarks</dt>
                  <dd className="mt-1 text-sm text-gray-900">{siblingsRemarks}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Section: Questionnaire */}
          {profile.answers && profile.answers.length > 0 && (
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-bold text-gray-900">Compatibility Questionnaire Responses</h3>
              </div>
              <div className="p-6 space-y-8 divide-y divide-gray-100">
                {(Object.entries(
                  profile.answers.reduce((acc: Record<string, any[]>, ans: any) => {
                    const cat = ans.question?.customCategory || ans.question?.category || 'General';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(ans);
                    return acc;
                  }, {})
                ) as [string, any[]][]).map(([category, answers], catIdx: number) => (
                  <div key={category} className={`space-y-4 ${catIdx > 0 ? 'pt-6' : ''}`}>
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{category}</h4>
                    <div className="space-y-4 divide-y divide-gray-100">
                      {answers.map((ans: any, idx: number) => (
                        <div key={ans.id || idx} className="pt-4 first:pt-0 last:pb-0">
                          <p className="text-sm font-semibold text-gray-800">{ans.question?.questionText}</p>
                          <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                            <div>
                              <span className="text-xs font-semibold text-gray-500 block mb-1">Answer:</span>
                              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                                {ans.selectedOption?.optionText || 'N/A'}
                              </p>
                            </div>
                            <div className="text-right self-end sm:self-start">
                              <span className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium text-indigo-700">
                                Importance: {ans.importance}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column - Side Panel */}
        <div className="space-y-6">

          {/* Card: Client Onboarding */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-905 uppercase tracking-wider border-b pb-2">Client Onboarding</h3>
            
            {/* Status indicators */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Client Review</span>
                <span className={`font-bold mt-1 block ${profile.clientApproved ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {profile.clientApproved ? 'Approved ✓' : 'Pending'}
                </span>
              </div>
              <div className="bg-gray-50 p-2 rounded border border-gray-100">
                <span className="block text-[10px] text-gray-400 font-semibold uppercase">Agency Review</span>
                <span className={`font-bold mt-1 block ${profile.agencyApproved ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {profile.agencyApproved ? 'Approved ✓' : 'Pending'}
                </span>
              </div>
            </div>

            {/* Rejection/Correction reasons */}
            {profile.clientRejectedReason && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-md">
                <span className="font-bold block mb-1">Revisions requested by client:</span>
                <p className="italic">"{profile.clientRejectedReason}"</p>
              </div>
            )}

             {/* Link details / Generation */}
             {profile.status === 'ACTIVE' ? (
               <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-md flex items-center justify-center gap-1.5 font-bold">
                 Onboarding Completed ✓
               </div>
             ) : (
               <>
                 {profile.onboardingLink ? (
                   <div className="space-y-2">
                     <div className="text-xs bg-slate-50 border border-gray-200 p-2.5 rounded break-all text-gray-600 font-mono">
                       {profile.onboardingLink}
                     </div>
                     <div className="flex justify-between items-center gap-2">
                       <span className="text-[10px] text-gray-400">
                         Expires: {new Date(profile.onboardingExpiry).toLocaleDateString()}
                       </span>
                       <button
                         type="button"
                         onClick={() => {
                           navigator.clipboard.writeText(profile.onboardingLink);
                           toast.success("Onboarding link copied!");
                         }}
                         className="text-xs font-semibold text-indigo-650 hover:text-indigo-850"
                       >
                         Copy Link
                       </button>
                     </div>
                   </div>
                 ) : (
                   <p className="text-xs text-gray-400 italic">No active review link generated.</p>
                 )}

                 {/* Generate link button */}
                 <button
                   type="button"
                   disabled={generateOnboardingMutation.isPending}
                   onClick={() => generateOnboardingMutation.mutate()}
                   className="w-full inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-505 disabled:opacity-50"
                 >
                   {generateOnboardingMutation.isPending ? 'Generating...' : (profile.onboardingLink ? 'Regenerate Link' : 'Generate Onboarding Link')}
                 </button>
               </>
             )}
          </div>

          {/* Card: Primary Photo */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">Primary Photo</h3>
            <div 
              className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border cursor-pointer"
              onClick={async () => {
                toast.success("Viewing photos...");
                try {
                  await ProfileService.logAccess(id, 'VIEW_PHOTOS');
                  queryClient.invalidateQueries({ queryKey: ['profile', id] });
                } catch (err) {
                  console.error(err);
                }
              }}
            >
              <img
                src={photoUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Card: Contact Information */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Information</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="block text-xs font-medium text-gray-400">Mobile</span>
                <span className="text-sm text-gray-900">{profile.person?.mobile || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-400">Email</span>
                <span className="text-sm text-gray-900 break-all">{profile.person?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Card: Partner Preferences */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Partner Preferences</h3>
            </div>
            <div className="p-4 space-y-4">
              {profile.preferences?.[0] ? (
                <>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Expected Age Range</span>
                    <span className="text-sm text-gray-900">
                      {profile.preferences[0].minAge && profile.preferences[0].maxAge
                        ? `${profile.preferences[0].minAge} - ${profile.preferences[0].maxAge} years`
                        : 'N/A'}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].agePriority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Expected Height Range</span>
                    <span className="text-sm text-gray-900">
                      {profile.preferences[0].minHeight && profile.preferences[0].maxHeight
                        ? `${formatHeight(profile.preferences[0].minHeight)} to ${formatHeight(profile.preferences[0].maxHeight)}`
                        : 'N/A'}
                    </span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].heightPriority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Religion Preference</span>
                    <span className="text-sm text-gray-900">{profile.preferences[0].religion || 'N/A'}</span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].religionPriority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Caste Preference</span>
                    <span className="text-sm text-gray-900">{profile.preferences[0].caste || 'N/A'}</span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].castePriority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">City Preference</span>
                    <span className="text-sm text-gray-900">{profile.preferences[0].city || 'N/A'}</span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].cityPriority}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Education Preference</span>
                    <span className="text-sm text-gray-900">{profile.preferences[0].education || 'N/A'}</span>
                    <span className="ml-2 inline-flex items-center rounded-md bg-gray-50 px-1.5 py-0.5 text-xs text-gray-400">
                      {profile.preferences[0].educationPriority}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">No partner preferences set</p>
              )}
            </div>
          </div>

          {/* Card: Lifestyle details */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Lifestyle</h3>
            </div>
            <div className="p-4 space-y-3">
              {profile.lifestyles?.[0] ? (
                <>
                  <div>
                    <span className="block text-xs font-medium text-gray-400">Diet / Food Habit</span>
                    <span className="text-sm text-gray-900">{profile.lifestyles[0].foodHabit || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400">Smoking Habit</span>
                    <span className="text-sm text-gray-900">
                      {profile.lifestyles[0].smoking === true ? 'Yes' : profile.lifestyles[0].smoking === false ? 'No' : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400">Drinking Habit</span>
                    <span className="text-sm text-gray-900">
                      {profile.lifestyles[0].drinking === true ? 'Yes' : profile.lifestyles[0].drinking === false ? 'No' : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400">Fitness / Exercise</span>
                    <span className="text-sm text-gray-900">{profile.lifestyles[0].fitnessLevel || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400">Hobbies</span>
                    <span className="text-sm text-gray-900">{profile.lifestyles[0].hobbies || 'N/A'}</span>
                  </div>
                </>
              ) : (
                <p className="text-xs text-gray-400">No lifestyle information recorded</p>
              )}
            </div>
          </div>

          {/* Card: Documents Uploaded */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Verification Documents</h3>
            </div>
            <div className="p-4 space-y-3">
              {profile.documents && profile.documents.length > 0 ? (
                profile.documents.map((doc: any, idx: number) => (
                  <div key={doc.id || idx} className="flex items-center justify-between border-b pb-2 last:border-b-0 last:pb-0">
                    <div>
                      <span className="block text-xs font-semibold text-indigo-600">{doc.documentType}</span>
                      <span className="text-[10px] text-gray-400">Status: {doc.approvalStatus}</span>
                    </div>
                    <a
                      href="#"
                      onClick={async (e) => {
                        e.preventDefault();
                        toast.success(`Downloading ${doc.documentType}...`);
                        try {
                          await ProfileService.logAccess(id, 'DOWNLOAD_DOCUMENT');
                          queryClient.invalidateQueries({ queryKey: ['profile', id] });
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-900"
                    >
                      View
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Card: Profile Activity */}
          <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Profile Activity</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-x-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="block text-xs font-medium text-gray-400">Total Views</span>
                  <span className="text-lg font-bold text-gray-900">
                    {profile.profileAccessLogs?.filter((log: any) => log.action === 'VIEW_PROFILE').length || 0}
                  </span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-gray-400">Unique Viewers</span>
                  <span className="text-lg font-bold text-gray-900">
                    {new Set((profile.profileAccessLogs || []).filter((log: any) => log.action === 'VIEW_PROFILE').map((log: any) => log.viewedByUserId)).size}
                  </span>
                </div>
              </div>

              {/* Agency Filter Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Filter by Agency</label>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 bg-white"
                >
                  <option value="ALL">All Agencies</option>
                  {Array.from(new Set((profile.profileAccessLogs || []).map((log: any) => log.agency?.name).filter(Boolean))).map((agencyName: any) => (
                    <option key={agencyName} value={agencyName}>{agencyName}</option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-400 mb-2">Access History</span>
                <div className="flow-root">
                  <ul role="list" className="space-y-4">
                    {(profile.profileAccessLogs || [])
                      .filter((log: any) => agencyFilter === "ALL" ? true : log.agency?.name === agencyFilter)
                      .slice(0, 5)
                      .map((log: any, logIdx: number) => (
                        <li key={log.id || logIdx} className="flex gap-x-3 items-start border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                          {/* Agency Avatar Logo/Initials */}
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-extrabold text-indigo-600 ring-1 ring-indigo-100 flex-shrink-0">
                            {getInitials(log.agency?.name)}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-x-2">
                              {/* Action Badge */}
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold ring-1 ring-inset ${
                                log.action === 'DOWNLOAD_DOCUMENT' ? 'bg-red-50 text-red-700 ring-red-650/10' :
                                log.action === 'VIEW_PHOTOS' ? 'bg-green-50 text-green-700 ring-green-600/10' :
                                'bg-blue-50 text-blue-700 ring-blue-600/10'
                              }`}>
                                {log.action === 'DOWNLOAD_DOCUMENT' ? '📄 Document Downloaded' :
                                 log.action === 'VIEW_PHOTOS' ? '📸 Photos Viewed' : '👁 Profile Viewed'}
                              </span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {formatRelativeTime(log.viewedAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              by <span className="font-semibold text-gray-800">{log.viewedByUser?.firstName || 'User'}</span> ({log.agency?.name || 'Agency'})
                            </p>
                          </div>
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
