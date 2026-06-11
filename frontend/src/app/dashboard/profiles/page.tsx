'use client';

import React from "react";
import Link from "next/link";
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProfileService } from "@/services/profile.service";

const queryClient = new QueryClient();

function ProfilesList() {
  const { data: profiles, isLoading, isError, error } = useQuery({
    queryKey: ["profiles"],
    queryFn: ProfileService.getProfiles,
  });

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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
  {isLoading && (
    <tr>
      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
        Loading profiles...
      </td>
    </tr>
  )}

  {isError && (
    <tr>
      <td colSpan={7} className="px-6 py-20 text-center text-red-600">
        Error loading profiles: {error instanceof Error ? error.message : 'Please try again.'}
      </td>
    </tr>
  )}

  {!isLoading && !isError && profiles?.length > 0 ? (
    profiles.map((profile: any) => (
      <tr key={profile.id} className="hover:bg-gray-50 transition-colors duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.profileNumber || profile.id}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.firstName && profile.lastName ? `${profile.firstName} ${profile.lastName}` : 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.gender || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.age || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.city || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.maritalStatus || 'N/A'}</td>
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div className="flex items-center justify-end gap-x-4">
            <Link
  href={`/dashboard/profiles/${profile.id}`}
  className="text-gray-400 hover:text-indigo-600"
  aria-label="View profile"
>
  <EyeIcon className="h-5 w-5" />
</Link>
            <button className="text-gray-400 hover:text-indigo-600" aria-label="Edit profile">
              <PencilSquareIcon className="h-5 w-5" />
            </button>
            <button className="text-gray-400 hover:text-red-600" aria-label="Delete profile">
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </td>
      </tr>
    ))
  ) : (
    !isLoading && !isError && (
      <tr>
        <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
          No profiles found.
        </td>
      </tr>
    )
  )}
</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ProfilesPage() {
  return <QueryClientProvider client={queryClient}><ProfilesList /></QueryClientProvider>;
}