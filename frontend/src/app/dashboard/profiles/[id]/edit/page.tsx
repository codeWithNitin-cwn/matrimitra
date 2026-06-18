'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '@/modules/profiles/profile.service';
import api from '@/services/api';
import toast from 'react-hot-toast';

interface ProfileFormInputs {
  name: string;
  gender: string;
  dob: string;
  age: string;
  height: string;
  religion: string;
  caste: string;
  subCaste: string;
  motherTongue: string;
  maritalStatus: string;
  city: string;
  state: string;
  country: string;
  weightKg: string;
  mobile: string;
  email: string;
  degree: string;
  college: string;
  specialization: string;
  graduationYear: string;
  occupation: string;
  company: string;
  salary: string;
  designation: string;
  workLocation: string;
  father: string;
  fatherOccupation: string;
  mother: string;
  motherOccupation: string;
  familyType: string;
  familyValues: string;
  siblingsCount: string;
  siblings: string;
  ageRange: string;
  heightRange: string;
  educationPreference: string;
  religionPreference: string;
  castePreference: string;
  cityPreference: string;
  professionPreference: string;
  agePriority: string;
  castePriority: string;
  religionPriority: string;
  heightPriority: string;
  cityPriority: string;
  educationPriority: string;
  professionPriority: string;
  smokingPreference: string;
  drinkingPreference: string;
  childrenPreference: string;
  familySetupPreference: string;
  relocationPreference: string;
  smokingPriority: string;
  drinkingPriority: string;
  childrenPriority: string;
  familySetupPriority: string;
  relocationPriority: string;
  foodHabit: string;
  smoking: string;
  drinking: string;
  fitnessLevel: string;
  hobbies: string;
  photoPrimary: string;
  documentsUploaded: string[];
  relationshipToClient: string;
  questionAnswers: Record<string, { optionId?: string; textAnswer?: string; importance: string }>;
}

export default function EditProfilePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: profile, isPending, isError } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => ProfileService.getProfileById(id),
    enabled: !!id,
  });

  // Load backend match questions
  const { data: dbQuestions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await api.get('/questions');
      return response.data?.data || [];
    }
  });

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    dbQuestions.forEach((q: any) => {
      const cat = q.customCategory || q.category || 'General';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(q);
    });
    return groups;
  }, [dbQuestions]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<ProfileFormInputs>();

  useEffect(() => {
    if (profile) {
      // Prepopulate base person info
      const firstName = profile.person?.firstName || '';
      const lastName = profile.person?.lastName || '';
      setValue('name', lastName ? `${firstName} ${lastName}` : firstName);
      setValue('gender', profile.person?.gender || '');
      setValue('mobile', profile.person?.mobile || '');
      setValue('email', profile.person?.email || '');
      setValue('relationshipToClient', profile.relationshipToClient || '');
      
      if (profile.person?.dob) {
        setValue('dob', new Date(profile.person.dob).toISOString().split('T')[0]);
      }

      // Prepopulate personal details
      setValue('religion', profile.personal?.religion || '');
      setValue('caste', profile.personal?.caste || '');
      setValue('subCaste', profile.personal?.subCaste || '');
      setValue('motherTongue', profile.personal?.motherTongue || '');
      setValue('maritalStatus', profile.personal?.maritalStatus || '');
      setValue('city', profile.personal?.city || '');
      setValue('state', profile.personal?.state || '');
      setValue('country', profile.personal?.country || '');
      setValue('weightKg', profile.personal?.weightKg ? profile.personal.weightKg.toString() : '');
      setValue('height', profile.personal?.heightCm ? `${profile.personal.heightCm} cm` : '');

      // Prepopulate educations (using first record)
      if (profile.educations?.[0]) {
        setValue('degree', profile.educations[0].qualification || '');
        setValue('college', profile.educations[0].institution || '');
        setValue('specialization', profile.educations[0].specialization || '');
        setValue('graduationYear', profile.educations[0].graduationYear ? profile.educations[0].graduationYear.toString() : '');
      }

      // Prepopulate careers (using first record)
      if (profile.careers?.[0]) {
        setValue('occupation', profile.careers[0].profession || '');
        setValue('company', profile.careers[0].employer || '');
        setValue('salary', profile.careers[0].annualIncome || '');
        setValue('designation', profile.careers[0].designation || '');
        setValue('workLocation', profile.careers[0].workLocation || '');
      }

      // Prepopulate family (using first record)
      if (profile.families?.[0]) {
        setValue('father', profile.families[0].fatherName || '');
        setValue('fatherOccupation', profile.families[0].fatherOccupation || '');
        setValue('mother', profile.families[0].motherName || '');
        setValue('motherOccupation', profile.families[0].motherOccupation || '');
        setValue('familyValues', profile.families[0].familyValues || '');
        setValue('siblingsCount', profile.families[0].siblingsCount ? profile.families[0].siblingsCount.toString() : '');
        
        // Parse combined familyType and siblings remarks back
        const rawFamilyType = profile.families[0].familyType || '';
        const parts = rawFamilyType.split(' | Remarks: ');
        setValue('familyType', parts[0] || '');
        setValue('siblings', parts[1] || '');
      }

      // Prepopulate preferences (using first record)
      if (profile.preferences?.[0]) {
        const minAge = profile.preferences[0].minAge || '';
        const maxAge = profile.preferences[0].maxAge || '';
        setValue('ageRange', minAge && maxAge ? `${minAge}-${maxAge}` : '');
        
        const formatHeightCm = (hCm: number | undefined | null) => {
          if (!hCm) return '';
          const totalInches = hCm / 2.54;
          const feet = Math.floor(totalInches / 12);
          const inches = Math.round(totalInches % 12);
          return `${feet}'${inches}"`;
        };
        setValue('heightRange', profile.preferences[0].minHeight && profile.preferences[0].maxHeight 
          ? `${formatHeightCm(profile.preferences[0].minHeight)} - ${formatHeightCm(profile.preferences[0].maxHeight)}` 
          : '');

        setValue('educationPreference', profile.preferences[0].education || '');
        setValue('religionPreference', profile.preferences[0].religion || '');
        setValue('castePreference', profile.preferences[0].caste || '');
        setValue('cityPreference', profile.preferences[0].city || '');
        setValue('professionPreference', profile.preferences[0].profession || '');
        setValue('agePriority', profile.preferences[0].agePriority || 'DOESNT_MATTER');
        setValue('castePriority', profile.preferences[0].castePriority || 'DOESNT_MATTER');
        setValue('religionPriority', profile.preferences[0].religionPriority || 'DOESNT_MATTER');
        setValue('heightPriority', profile.preferences[0].heightPriority || 'DOESNT_MATTER');
        setValue('cityPriority', profile.preferences[0].cityPriority || 'DOESNT_MATTER');
         setValue('educationPriority', profile.preferences[0].educationPriority || 'DOESNT_MATTER');
        setValue('professionPriority', profile.preferences[0].professionPriority || 'DOESNT_MATTER');
        setValue('smokingPreference', profile.preferences[0].smokingPreference === true ? 'true' : profile.preferences[0].smokingPreference === false ? 'false' : '');
        setValue('drinkingPreference', profile.preferences[0].drinkingPreference === true ? 'true' : profile.preferences[0].drinkingPreference === false ? 'false' : '');
        setValue('childrenPreference', profile.preferences[0].childrenPreference || '');
        setValue('familySetupPreference', profile.preferences[0].familySetupPreference || '');
        setValue('relocationPreference', profile.preferences[0].relocationPreference || '');
        setValue('smokingPriority', profile.preferences[0].smokingPriority || 'DOESNT_MATTER');
        setValue('drinkingPriority', profile.preferences[0].drinkingPriority || 'DOESNT_MATTER');
        setValue('childrenPriority', profile.preferences[0].childrenPriority || 'DOESNT_MATTER');
        setValue('familySetupPriority', profile.preferences[0].familySetupPriority || 'DOESNT_MATTER');
        setValue('relocationPriority', profile.preferences[0].relocationPriority || 'DOESNT_MATTER');
      }

      // Prepopulate lifestyle (using first record)
      if (profile.lifestyles?.[0]) {
        setValue('foodHabit', profile.lifestyles[0].foodHabit || '');
        setValue('smoking', profile.lifestyles[0].smoking === true ? 'true' : 'false');
        setValue('drinking', profile.lifestyles[0].drinking === true ? 'true' : 'false');
        setValue('fitnessLevel', profile.lifestyles[0].fitnessLevel || '');
        
        let hobbiesVal = '';
        if (profile.lifestyles[0].hobbies) {
          if (Array.isArray(profile.lifestyles[0].hobbies)) {
            hobbiesVal = profile.lifestyles[0].hobbies.join(', ');
          } else if (typeof profile.lifestyles[0].hobbies === 'string') {
            hobbiesVal = profile.lifestyles[0].hobbies;
          } else {
            hobbiesVal = JSON.stringify(profile.lifestyles[0].hobbies);
          }
        }
        setValue('hobbies', hobbiesVal);
      }

      // Prepopulate photo and documents
      if (profile.photos && profile.photos.length > 0) {
        setValue('photoPrimary', profile.photos.find((p: any) => p.isPrimary)?.cloudinaryUrl || profile.photos[0].cloudinaryUrl);
      }
      if (profile.documents && profile.documents.length > 0) {
        setValue('documentsUploaded', profile.documents.map((d: any) => d.documentType));
      }

      // Prepopulate questionnaire answers
      if (profile.answers && Array.isArray(profile.answers)) {
        profile.answers.forEach((ans: any) => {
          if (ans.questionId) {
            const isLongText = ans.question?.questionText && 
              (() => {
                try {
                  const parsed = JSON.parse(ans.question.questionText);
                  return parsed.type === 'LONG_TEXT';
                } catch (e) {
                  return false;
                }
              })();

            if (isLongText) {
              setValue(`questionAnswers.${ans.questionId}`, {
                textAnswer: ans.selectedOption?.optionText || '',
                importance: ans.importance || 'MUST_HAVE'
              });
            } else {
              setValue(`questionAnswers.${ans.questionId}`, {
                optionId: ans.selectedOptionId || '',
                importance: ans.importance || 'MUST_HAVE'
              });
            }
          }
        });
      }
    }
  }, [profile, setValue]);

  const updateProfileMutation = useMutation({
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

  const onSubmit = (data: ProfileFormInputs) => {
    setApiError(null);
    updateProfileMutation.mutate(data);
  };

  if (isPending) {
    return <div className="p-8 text-gray-600">Loading profile data...</div>;
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Edit Profile ({profile.profileNumber})</h1>
        <p className="mt-2 text-sm text-gray-600">Update matchmaking profile and preference details.</p>
      </div>

      {apiError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200 bg-white p-6 shadow-md sm:rounded-lg sm:p-8">
        
        {/* SECTION 1: Personal Details */}
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Personal Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" {...register('name', { required: 'Name is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select {...register('gender', { required: 'Gender is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship to Client</label>
              <select {...register('relationshipToClient')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="SELF">Self</option>
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="BROTHER">Brother</option>
                <option value="SISTER">Sister</option>
                <option value="RELATIVE">Relative</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" {...register('dob')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height (ft/in or cm)</label>
              <input type="text" placeholder="e.g. 5' 8&quot; or 178 cm" {...register('height')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
              <input type="number" placeholder="e.g. 70" {...register('weightKg')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
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
              <label className="block text-sm font-medium text-gray-700">Sub-Caste</label>
              <input type="text" {...register('subCaste')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
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
            <div>
              <label className="block text-sm font-medium text-gray-700">State</label>
              <input type="text" {...register('state')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input type="text" {...register('country')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* SECTION 2: Contact Details */}
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

        {/* SECTION 3: Education */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Education</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Degree</label>
              <input type="text" {...register('degree')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">College / Institution</label>
              <input type="text" {...register('college')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Specialization</label>
              <input type="text" {...register('specialization')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
              <input type="number" {...register('graduationYear')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* SECTION 4: Career */}
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
              <label className="block text-sm font-medium text-gray-700">Designation</label>
              <input type="text" {...register('designation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Salary (Annual Income)</label>
              <input type="text" {...register('salary')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Work Location</label>
              <input type="text" {...register('workLocation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* SECTION 5: Family Details */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Family Details</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Father's Name</label>
              <input type="text" {...register('father')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Father's Occupation</label>
              <input type="text" {...register('fatherOccupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
              <input type="text" {...register('mother')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mother's Occupation</label>
              <input type="text" {...register('motherOccupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Type</label>
              <select {...register('familyType')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select</option>
                <option value="Nuclear">Nuclear</option>
                <option value="Joint">Joint</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Values</label>
              <select {...register('familyValues')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select</option>
                <option value="Orthodox">Orthodox</option>
                <option value="Traditional">Traditional</option>
                <option value="Moderate">Moderate</option>
                <option value="Liberal">Liberal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Siblings Count</label>
              <input type="number" {...register('siblingsCount')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Siblings Remarks</label>
              <textarea rows={2} {...register('siblings')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 6: Lifestyle */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Lifestyle</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Food Habit</label>
              <select {...register('foodHabit')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select Habit</option>
                <option value="Vegetarian">Vegetarian</option>
                <option value="Non-Vegetarian">Non-Vegetarian</option>
                <option value="Eggetarian">Eggetarian</option>
                <option value="Vegan">Vegan</option>
                <option value="Jain">Jain</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Smoking</label>
              <select {...register('smoking')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Drinking</label>
              <select {...register('drinking')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Fitness Level</label>
              <select {...register('fitnessLevel')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Select Fitness</option>
                <option value="Sedentary">Sedentary</option>
                <option value="Average">Average</option>
                <option value="Active">Active</option>
                <option value="Athletic">Athletic</option>
                <option value="Gym Enthusiast">Gym Enthusiast</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Hobbies</label>
              <input type="text" placeholder="e.g. Reading, Music, Traveling" {...register('hobbies')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
          </div>
        </div>

        {/* SECTION 7: Partner Preferences */}
        <div className="pt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Partner Preferences</h3>
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Age Range</label>
              <input type="text" placeholder="e.g. 25-30" {...register('ageRange')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age Filter Importance</label>
              <select {...register('agePriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height Range</label>
              <input type="text" placeholder="e.g. 5'0&quot; - 5'5&quot;" {...register('heightRange')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height Filter Importance</label>
              <select {...register('heightPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Religion Preference</label>
              <input type="text" {...register('religionPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Religion Importance</label>
              <select {...register('religionPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Caste Preference</label>
              <input type="text" {...register('castePreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Caste Importance</label>
              <select {...register('castePriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City Preference</label>
              <input type="text" {...register('cityPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City Importance</label>
              <select {...register('cityPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Education Preference</label>
              <input type="text" {...register('educationPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Education Importance</label>
              <select {...register('educationPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profession Preference</label>
              <input type="text" {...register('professionPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Profession Importance</label>
              <select {...register('professionPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Smoking Preference</label>
              <select {...register('smokingPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Doesn't Matter</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Smoking Importance</label>
              <select {...register('smokingPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Drinking Preference</label>
              <select {...register('drinkingPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Doesn't Matter</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Drinking Importance</label>
              <select {...register('drinkingPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Children Preference</label>
              <select {...register('childrenPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Doesn't Matter</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Undecided">Undecided</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Children Importance</label>
              <select {...register('childrenPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Setup Preference</label>
              <select {...register('familySetupPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Doesn't Matter</option>
                <option value="Joint family">Joint family</option>
                <option value="Nuclear family">Nuclear family</option>
                <option value="Either">Either</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Family Setup Importance</label>
              <select {...register('familySetupPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relocation Preference</label>
              <select {...register('relocationPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="">Doesn't Matter</option>
                <option value="Abroad">Abroad</option>
                <option value="Flexible">Flexible</option>
                <option value="Metro city">Metro city</option>
                <option value="Current city">Current city</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Relocation Importance</label>
              <select {...register('relocationPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2">
                <option value="MUST_HAVE">Must Have</option>
                <option value="IMPORTANT">Important</option>
                <option value="PREFERRED">Preferred</option>
                <option value="DOESNT_MATTER">Doesn't Matter</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION 8: Compatibility Questionnaire */}
        <div className="pt-8 border-t border-gray-200 mt-8">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-2">Compatibility Questionnaire</h3>
          <p className="text-xs text-gray-500 mb-6">Review and update the client's compatibility questionnaire responses.</p>
          
          {dbQuestions.length === 0 ? (
            <p className="text-sm italic text-gray-500 py-4">No matchmaking questions configured in the database.</p>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedQuestions).map(([category, questions]: [string, any[]]) => (
                <div key={category} className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">{category}</h4>
                  <div className="space-y-6">
                    {questions.map((q: any) => (
                      <div key={q.id} className="p-4 border rounded-md border-gray-200 bg-gray-50/50">
                        <h5 className="text-sm font-semibold text-gray-800 mb-3">{q.questionText}</h5>
                        
                        {q.type === 'LONG_TEXT' ? (
                          <div className="mb-4">
                            <textarea
                              rows={3}
                              {...register(`questionAnswers.${q.id}.textAnswer`)}
                              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-gray-900 bg-white"
                              placeholder="Provide detailed thoughts here..."
                            />
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {q.options?.map((opt: any) => (
                              <label key={opt.id} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer p-2 border rounded bg-white hover:bg-gray-50">
                                <input 
                                  type="radio" 
                                  value={opt.id}
                                  {...register(`questionAnswers.${q.id}.optionId`)}
                                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{opt.optionText}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 border-t border-gray-150 pt-3 mt-3">
                          <label className="text-xs font-semibold text-gray-500">Importance weighting:</label>
                          <select
                            {...register(`questionAnswers.${q.id}.importance`)}
                            className="text-xs border rounded p-1 text-gray-900 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="MUST_HAVE">Must Have</option>
                            <option value="NICE_TO_HAVE">Nice To Have</option>
                            <option value="DOESNT_MATTER">Doesn't Matter</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="pt-8 flex flex-col-reverse justify-end gap-y-4 gap-x-4 sm:flex-row border-t border-gray-200 mt-8 pt-6">
          <Link href={`/dashboard/profiles/${id}`} className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
            Cancel
          </Link>
          <button type="submit" disabled={updateProfileMutation.isPending} className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 hover:cursor-pointer">
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  );
}
