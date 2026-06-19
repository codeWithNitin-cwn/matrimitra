"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "./profile.service";
import { useAuthStore } from "@/modules/auth/auth.store";

function calculateCompletion(profile: any) {
  if (profile.status === 'APPROVED') return 100;
  
  const fields = [
    profile.firstName,
    profile.lastName,
    profile.gender && profile.gender !== 'UNKNOWN' && profile.gender !== 'N/A',
    profile.age && profile.age !== 'N/A',
    profile.city && profile.city !== 'N/A',
    profile.maritalStatus && profile.maritalStatus !== 'N/A',
  ];
  
  const filled = fields.filter(f => f !== undefined && f !== null && f !== '' && f !== false).length;
  return Math.round((filled / fields.length) * 100);
}

function getStatusBadge(status: string, completion: number) {
  if (status === 'ACTIVE' || status === 'APPROVED') {
    return (
      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
        Active
      </span>
    );
  }
  if (status === 'REJECTED') {
    return (
      <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
        Rejected
      </span>
    );
  }
  if (status === 'CORRECTION_REQUESTED') {
    return (
      <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-600/20">
        Revision Requested
      </span>
    );
  }
  if (status === 'CLIENT_UPDATED') {
    return (
      <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
        Client Updated
      </span>
    );
  }
  if (status === 'PENDING' || status === 'UNDER_REVIEW') {
    return (
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
        {status === 'UNDER_REVIEW' ? 'Under Review' : 'Pending'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-850 ring-1 ring-inset ring-yellow-600/20">
      Draft ({completion}%)
    </span>
  );
}

export default function ProfilesListView() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const isOwner = user?.role === "OWNER";

  const [profileToDelete, setProfileToDelete] = useState<any>(null);

  const { data: profiles, isLoading, isError, error } = useQuery({
    queryKey: ["profiles"],
    queryFn: ProfileService.getProfiles,
  });

  const deleteMutation = useMutation({
    mutationFn: ProfileService.deleteProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      setProfileToDelete(null);
    },
    onError: (error: any) => {
      alert(error.response?.data?.error?.message || "Failed to delete profile");
      setProfileToDelete(null);
    }
  });

  const handleConfirmDelete = () => {
    if (profileToDelete) {
      deleteMutation.mutate(profileToDelete.id);
    }
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    return profiles
      .filter((profile: any) => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim().toLowerCase();
        const profileId = (profile.profileNumber || profile.id || '').toLowerCase();
        
        const matchesSearch = profileId.includes(searchLower) || fullName.includes(searchLower);
        const matchesGender = genderFilter ? profile.gender === genderFilter : true;
        
        let matchesStatus = true;
        if (statusFilter === "APPROVED") {
          matchesStatus = profile.status === "APPROVED" || profile.status === "ACTIVE";
        } else if (statusFilter === "DRAFT") {
          matchesStatus = profile.status !== "APPROVED" && profile.status !== "ACTIVE";
        }
        
        return matchesSearch && matchesGender && matchesStatus;
      })
      .sort((a: any, b: any) => {
        const aActive = (a.status === "APPROVED" || a.status === "ACTIVE") ? 1 : 0;
        const bActive = (b.status === "APPROVED" || b.status === "ACTIVE") ? 1 : 0;
        return bActive - aActive;
      });
  }, [profiles, searchTerm, genderFilter, statusFilter]);

  return (
    <div className="container mx-auto">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profiles Management</h1>
        <Link
          href="/dashboard/profiles/create"
          className="inline-flex items-center justify-center sm:justify-start gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Create Profile
        </Link>
      </div>

      {/* Filters Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by ID or Name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        />
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        >
          <option value="">All Genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="UNKNOWN">Unknown</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">Active Only</option>
          <option value="DRAFT">Drafts Only</option>
        </select>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profile ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marital Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                    Loading profiles...
                  </td>
                </tr>
              )}

              {isError && (
                <tr>
                  <td colSpan={8} className="px-6 py-20 text-center text-red-600">
                    Error loading profiles: {error instanceof Error ? error.message : 'Please try again.'}
                  </td>
                </tr>
              )}

              {!isLoading && !isError && filteredProfiles.length > 0 ? (
                filteredProfiles.map((profile: any) => {
                  const completion = calculateCompletion(profile);
                  return (
                    <tr key={profile.id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.profileNumber || profile.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.firstName ? `${profile.firstName} ${profile.lastName || ''}`.trim() : 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.gender || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.age || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.city || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.maritalStatus || 'Draft'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{getStatusBadge(profile.status, completion)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-x-4">
                          <Link
                            href={`/dashboard/profiles/${profile.id}`}
                            className="text-gray-400 hover:text-indigo-600"
                            aria-label="View profile"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                          <Link
                            href={`/dashboard/profiles/${profile.id}/edit`}
                            className="text-gray-400 hover:text-indigo-600"
                            aria-label="Edit profile"
                          >
                            <PencilSquareIcon className="h-5 w-5" />
                          </Link>
                          {isOwner && profile.status === "DRAFT" && (
                            <button
                              onClick={() => setProfileToDelete(profile)}
                              className="text-gray-400 hover:text-red-600"
                              aria-label="Delete profile"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                !isLoading && !isError && (
                  <tr>
                    <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                      No profiles found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Profile</h3>
            <p className="text-sm text-gray-500 mb-6">
              Are you sure you want to delete profile <strong>{profileToDelete.profileNumber || profileToDelete.id}</strong>? This action cannot be undone and will delete all associated data.
            </p>
            <div className="flex justify-end gap-x-3">
              <button
                onClick={() => setProfileToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-650 hover:bg-red-700 rounded-md disabled:bg-red-300"
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
