'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ProfileService } from '@/services/profile.service';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ViewProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const { data: profile, isPending, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ProfileService.getProfileById(id),
    enabled: !!id,
  });

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

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/profiles" className="text-gray-500 hover:text-gray-900">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Profile Details</h1>
        </div>
        <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-medium ${
          profile.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
        }`}>
          {profile.status}
        </span>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {profile.person?.firstName} {profile.person?.lastName}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Profile ID: {profile.profileNumber}</p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            {/* Base Person Details */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.person?.gender || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.person?.email || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Mobile</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.person?.mobile || 'N/A'}</dd>
            </div>
            
            {/* Extended Details */}
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">City</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.personal?.city || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Religion</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.personal?.religion || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Highest Education</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.educations?.[0]?.qualification || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Occupation</dt>
              <dd className="mt-1 text-sm text-gray-900">{profile.careers?.[0]?.profession || 'N/A'}</dd>
            </div>
          </dl>
        </div>
      </div>

    </div>
  );
}
