'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/services/profile.service';
import toast from 'react-hot-toast';

export default function EditProfilePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const queryClient = useQueryClient();

  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { data: profile, isPending: isFetching } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ProfileService.getProfileById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (profile) {
      let age = '';
      let dob = '';
      if (profile.person?.dob) {
        const d = new Date(profile.person.dob);
        dob = d.toISOString().split('T')[0];
        age = (new Date().getFullYear() - d.getFullYear()).toString();
      }

      let ageRange = '';
      if (profile.preferences?.[0]?.minAge || profile.preferences?.[0]?.maxAge) {
        ageRange = `${profile.preferences[0].minAge || ''}-${profile.preferences[0].maxAge || ''}`;
      }

      reset({
        name: `${profile.person?.firstName || ''} ${profile.person?.lastName || ''}`.trim(),
        gender: profile.person?.gender || '',
        dob,
        age,
        height: profile.personal?.heightCm ? profile.personal.heightCm.toString() : '',
        religion: profile.personal?.religion || '',
        caste: profile.personal?.caste || '',
        motherTongue: profile.personal?.motherTongue || '',
        maritalStatus: profile.personal?.maritalStatus || '',
        city: profile.personal?.city || '',
        mobile: profile.person?.mobile || '',
        email: profile.person?.email || '',
        degree: profile.educations?.[0]?.qualification || '',
        college: profile.educations?.[0]?.institution || '',
        occupation: profile.careers?.[0]?.profession || '',
        company: profile.careers?.[0]?.employer || '',
        salary: profile.careers?.[0]?.annualIncome ? profile.careers[0].annualIncome.toString() : '',
        father: profile.families?.[0]?.fatherName || '',
        mother: profile.families?.[0]?.motherName || '',
        siblings: profile.families?.[0]?.familyType || '',
        ageRange: ageRange === '-' ? '' : ageRange,
        educationPreference: profile.preferences?.[0]?.education || '',
      });
    }
  }, [profile, reset]);

  const updateDraftMutation = useMutation({
    mutationFn: (data: any) => ProfileService.updateDraft(id, data),
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile', id] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
      router.push(`/dashboard/profiles/${id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to update profile.';
      setApiError(message);
      toast.error(message);
    },
  });

  const onSubmit = (data: any) => {
    setApiError(null);
    updateDraftMutation.mutate(data);
  };

  if (isFetching) {
    return <div className="p-8 text-gray-600">Loading profile data...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update the details for {profile?.profileNumber}.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200 bg-white p-6 shadow-md sm:rounded-lg sm:p-8">
        
        {/* Personal Details */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select {...register('gender', { required: 'Gender is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" {...register('dob', {
                validate: value => !value || new Date(value) <= new Date() || 'Date of birth cannot be in the future'
              })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
              {errors.dob && <p className="mt-1 text-sm text-red-600">{errors.dob.message as string}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age</label>
              <input type="number" {...register('age')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height</label>
              <input type="text" placeholder="e.g. 5' 8&quot;" {...register('height')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Religion</label>
              <input type="text" {...register('religion')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Caste</label>
              <input type="text" {...register('caste')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mother Tongue</label>
              <input type="text" {...register('motherTongue')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Marital Status</label>
              <select {...register('maritalStatus')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select</option>
                <option value="Never Married">Never Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
                <option value="Awaiting Divorce">Awaiting Divorce</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input type="text" {...register('city')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Contact Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="tel" {...register('mobile')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Education</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input type="text" {...register('degree')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">College</label>
              <input type="text" {...register('college')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* Career */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Career</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Occupation</label>
              <input type="text" {...register('occupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <input type="text" {...register('company')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary</label>
              <input type="text" {...register('salary')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 flex flex-col-reverse justify-end gap-y-4 gap-x-4 sm:flex-row border-t border-gray-200 mt-8 pt-6">
          <Link href={`/dashboard/profiles/${id}`} className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={updateDraftMutation.isPending} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50">
            {updateDraftMutation.isPending ? 'Saving...' : 'Update Profile'}
          </button>
        </div>

      </form>
    </div>
  );
}
