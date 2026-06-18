'use client';

import React from 'react';
import { PlusIcon, EyeIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Profile {
  id: string;
  name: string;
  gender: 'Female' | 'Male';
  age: number;
  city: string;
  maritalStatus: 'Single' | 'Divorced' | 'Widowed';
}

const mockProfiles: Profile[] = [
  { id: 'MM-001', name: 'Priya Sharma', gender: 'Female', age: 28, city: 'Mumbai', maritalStatus: 'Single' },
  { id: 'MM-002', name: 'Rahul Reddy', gender: 'Male', age: 32, city: 'Hyderabad', maritalStatus: 'Single' },
  { id: 'MM-003', name: 'Sneha Patel', gender: 'Female', age: 29, city: 'Ahmedabad', maritalStatus: 'Divorced' },
];

export default function ProfilesPage() {
  return (
    <div className="container mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Profiles Management</h1>
        <button
          type="button"
          className="inline-flex items-center justify-center sm:justify-start gap-x-2 rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <PlusIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
          Create Profile
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profile ID
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Full Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gender
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Age
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Marital Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50 transition-colors duration-150">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{profile.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.gender}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.age}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.city}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{profile.maritalStatus}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-x-4">
                      <button className="text-gray-400 hover:text-indigo-600" aria-label="View profile">
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button className="text-gray-400 hover:text-indigo-600" aria-label="Edit profile">
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button className="text-gray-400 hover:text-red-600" aria-label="Delete profile">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {mockProfiles.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <p className="mt-4 text-lg font-medium text-gray-700">No profiles found.</p>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new profile.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
