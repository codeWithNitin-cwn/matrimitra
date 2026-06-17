'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ProfileService } from '@/services/profile.service';
import { ClientService } from '@/services/client.service';
import api from '@/services/api';
import toast from 'react-hot-toast';
import { CheckCircleIcon, PlayIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';

const getMappedRelationship = (param: string | null): string => {
  if (!param) return 'Self';
  const upper = param.toUpperCase();
  if (upper === 'SELF') return 'Self';
  if (upper === 'SON') return 'Son';
  if (upper === 'DAUGHTER') return 'Daughter';
  if (upper === 'BROTHER') return 'Brother';
  if (upper === 'SISTER') return 'Sister';
  if (upper === 'RELATIVE') return 'Relative';
  return 'Self';
};

const STEPS = [
  { id: 1, name: 'Basic Profile', required: true },
  { id: 2, name: 'Personal Details', required: true },
  { id: 3, name: 'Education', required: true },
  { id: 4, name: 'Career', required: true },
  { id: 5, name: 'Family Details', required: true },
  { id: 6, name: 'Partner Preferences', required: true },
  { id: 7, name: 'Lifestyle Details', required: false },
  { id: 8, name: 'Compatibility Match', required: false },
  { id: 9, name: 'Photos & Documents', required: false },
  { id: 10, name: 'Review & Submit', required: true },
];

function CreateProfileWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const relationshipParam = searchParams.get('relationship');
  const [activeStep, setActiveStep] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Load client details if starting from Client Management
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => ClientService.getClientById(clientId!),
    enabled: !!clientId,
  });

  // Load backend match questions (Step 8)
  const { data: dbQuestions = [] } = useQuery({
    queryKey: ['questions'],
    queryFn: async () => {
      const response = await api.get('/questions');
      return response.data?.data || [];
    }
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      relationship: getMappedRelationship(relationshipParam),
      name: '',
      gender: '',
      dob: '',
      age: '',
      height: '',
      religion: '',
      caste: '',
      subCaste: '',
      motherTongue: '',
      maritalStatus: '',
      city: '',
      state: '',
      country: '',
      weightKg: '',
      degree: '',
      college: '',
      specialization: '',
      graduationYear: '',
      occupation: '',
      company: '',
      salary: '',
      workLocation: '',
      designation: '',
      father: '',
      fatherOccupation: '',
      mother: '',
      motherOccupation: '',
      siblings: '',
      siblingsCount: '',
      familyType: '',
      familyValues: '',
      ageRange: '',
      heightRange: '',
      educationPreference: '',
      castePreference: '',
      religionPreference: '',
      cityPreference: '',
      professionPreference: '',
      agePriority: 'DOESNT_MATTER',
      castePriority: 'DOESNT_MATTER',
      religionPriority: 'DOESNT_MATTER',
      heightPriority: 'DOESNT_MATTER',
      cityPriority: 'DOESNT_MATTER',
      educationPriority: 'DOESNT_MATTER',
      professionPriority: 'DOESNT_MATTER',
      smokingPreference: '',
      drinkingPreference: '',
      childrenPreference: '',
      familySetupPreference: '',
      relocationPreference: '',
      smokingPriority: 'DOESNT_MATTER',
      drinkingPriority: 'DOESNT_MATTER',
      childrenPriority: 'DOESNT_MATTER',
      familySetupPriority: 'DOESNT_MATTER',
      relocationPriority: 'DOESNT_MATTER',
      foodHabit: '',
      smoking: 'false',
      drinking: 'false',
      fitnessLevel: '',
      hobbies: '',
      mobile: '',
      email: '',
      questionAnswers: {} as Record<string, { optionId?: string; textAnswer?: string; importance: string }>,
      photoPrimary: '',
      documentsUploaded: [] as string[],
    }
  });

  const relationship = watch('relationship');
  const watchedFields = watch();

  useEffect(() => {
    if (relationshipParam) {
      setValue('relationship', getMappedRelationship(relationshipParam));
    }
  }, [relationshipParam, setValue]);

  useEffect(() => {
    if (client) {
      setValue('mobile', client.mobile || '');
      setValue('email', client.email || '');
      if (relationship === 'Self') {
        setValue('name', `${client.firstName} ${client.lastName || ''}`.trim());
      }
    }
  }, [client, relationship, setValue]);

  const isSelf = clientId ? (relationship === 'Self') : false;

  // Completion Percentage calculation
  const stats = useMemo(() => {
    const isStep1Done = !!(watchedFields.name && watchedFields.gender);
    const isStep2Done = !!(watchedFields.religion && watchedFields.maritalStatus);
    const isStep3Done = !!(watchedFields.degree);
    const isStep4Done = !!(watchedFields.occupation);
    const isStep5Done = !!(watchedFields.father || watchedFields.mother);
    const isStep6Done = !!(watchedFields.ageRange || watchedFields.educationPreference);
    
    const isLifestyleDone = !!(watchedFields.foodHabit || watchedFields.fitnessLevel);
    const isQuestionnaireDone = Object.keys(watchedFields.questionAnswers || {}).length > 0;
    const isPhotosDone = !!watchedFields.photoPrimary;

    let percentage = 0;
    if (isStep1Done) percentage += 15;
    if (isStep2Done) percentage += 15;
    if (isStep3Done) percentage += 15;
    if (isStep4Done) percentage += 15;
    if (isStep5Done) percentage += 15;
    if (isStep6Done) percentage += 15;
    if (isLifestyleDone) percentage += 5;
    if (isQuestionnaireDone) percentage += 3;
    if (isPhotosDone) percentage += 2;

    const sections = {
      'Basic Profile': isStep1Done,
      'Personal Details': isStep2Done,
      'Education Details': isStep3Done,
      'Career details': isStep4Done,
      'Family Details': isStep5Done,
      'Partner Preferences': isStep6Done,
      'Lifestyle (Optional)': isLifestyleDone,
      'Questionnaire (Optional)': isQuestionnaireDone,
      'Photos & Documents (Optional)': isPhotosDone,
    };

    return { percentage, sections };
  }, [watchedFields]);

  // Group questions by category for Step 8 display
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

  // Count answered questions for progress tracking
  const answeredCount = useMemo(() => {
    const answers = watchedFields.questionAnswers || {};
    return Object.values(answers).filter((ans: any) => ans?.optionId || ans?.textAnswer).length;
  }, [watchedFields.questionAnswers]);

  // Save Draft Mutation
  const saveDraftMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        clientId: clientId || undefined,
        relationshipToClient: data.relationship ? data.relationship.toUpperCase() : undefined,
      };

      if (!profileId) {
        const response = await ProfileService.createDraft(payload);
        return response.data;
      } else {
        const response = await ProfileService.updateDraft(profileId, payload);
        return response.data;
      }
    },
    onSuccess: (data: any) => {
      toast.success('Draft profile synced successfully!');
      if (data?.id && !profileId) {
        setProfileId(data.id);
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || 'Failed to save draft progress.';
      setApiError(message);
      toast.error(message);
    },
  });

  // Submit profile to Review Mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!profileId) throw new Error('No profile saved to submit.');
      await ProfileService.updateStatus(profileId, 'PENDING');
    },
    onSuccess: () => {
      toast.success('Profile submitted for Review successfully!');
      router.push('/dashboard/profiles');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit profile.');
    }
  });

  const handleSaveDraftOnly = () => {
    const currentData = getValues();
    saveDraftMutation.mutate(currentData);
  };

  const handleNextStep = () => {
    setApiError(null);
    const currentData = getValues();
    
    // Save draft state before moving next
    saveDraftMutation.mutate(currentData, {
      onSuccess: (data: any) => {
        if (data?.id || profileId) {
          if (activeStep < 10) {
            setActiveStep(prev => prev + 1);
          }
        }
      }
    });
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      setActiveStep(prev => prev - 1);
    }
  };

  if (clientId && isClientLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Title & Progress Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">matrimonial Onboarding Wizard</h1>
          <p className="mt-1 text-sm text-gray-600">Complete the steps below. Sections marked optional are future compatibility inputs.</p>
        </div>
        <div className="w-full md:w-64 bg-gray-100 rounded-full h-4 overflow-hidden border border-gray-200 relative">
          <div 
            className="bg-indigo-600 h-full transition-all duration-500 ease-out" 
            style={{ width: `${stats.percentage}%` }}
          />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-700">
            {stats.percentage}% Completed
          </span>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left progress panel */}
        <div className="w-full lg:w-64 shrink-0 bg-white border border-gray-200 rounded-lg p-4 shadow-sm self-start">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 px-2">Onboarding Steps</h3>
          <nav className="space-y-1">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id;
              // Check completion status based on our stats calculation
              let isDone = false;
              if (step.id === 1) isDone = stats.sections['Basic Profile'];
              if (step.id === 2) isDone = stats.sections['Personal Details'];
              if (step.id === 3) isDone = stats.sections['Education Details'];
              if (step.id === 4) isDone = stats.sections['Career details'];
              if (step.id === 5) isDone = stats.sections['Family Details'];
              if (step.id === 6) isDone = stats.sections['Partner Preferences'];
              if (step.id === 7) isDone = stats.sections['Lifestyle (Optional)'];
              if (step.id === 8) isDone = stats.sections['Questionnaire (Optional)'];
              if (step.id === 9) isDone = stats.sections['Photos & Documents (Optional)'];

              return (
                <button
                  key={step.id}
                  onClick={() => profileId && setActiveStep(step.id)}
                  disabled={!profileId && step.id > 1}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {step.id}
                    </span>
                    <span className="truncate">{step.name}</span>
                  </span>
                  {isDone ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-500 shrink-0" />
                  ) : (
                    <span className={`text-[10px] font-bold tracking-wide ${step.required ? 'text-orange-500' : 'text-gray-400'}`}>
                      {step.required ? 'REQ' : 'OPT'}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center work area form */}
        <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-8">
          
          {/* STEP 1: Basic Profile */}
          {activeStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 1: Basic Profile Details</h2>
              {client && (
                <div className="mb-4 bg-indigo-50 border border-indigo-200 rounded p-4 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold text-indigo-950">Linked Matrimonial Client:</span> {client.firstName} {client.lastName || ''} ({client.clientCode})
                  </div>
                  <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{relationship}</span>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Candidate Name *</label>
                  <input type="text" {...register('name', { required: 'Name is required' })} readOnly={isSelf} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 ${isSelf ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender *</label>
                  <select {...register('gender', { required: 'Gender is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                  <input type="date" {...register('dob')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Approximate Age</label>
                  <input type="number" {...register('age')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
                  <input type="tel" {...register('mobile')} readOnly={!!clientId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 ${clientId ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address</label>
                  <input type="email" {...register('email')} readOnly={!!clientId} className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 ${clientId ? 'bg-gray-100 cursor-not-allowed' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Primary Resident City</label>
                  <input type="text" {...register('city')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Personal Details */}
          {activeStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 2: Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Religion *</label>
                  <input type="text" {...register('religion', { required: 'Religion is required' })} placeholder="e.g. Hindu, Christian" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                  {errors.religion && <p className="mt-1 text-xs text-red-600">{errors.religion.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Caste</label>
                  <input type="text" {...register('caste')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sub-Caste</label>
                  <input type="text" {...register('subCaste')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother Tongue</label>
                  <input type="text" {...register('motherTongue')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (ft/in or cm)</label>
                  <input type="text" placeholder="e.g. 5' 8&quot;" {...register('height')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input type="number" {...register('weightKg')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Marital Status *</label>
                  <select {...register('maritalStatus', { required: 'Marital status is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Status</option>
                    <option value="Never Married">Never Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                    <option value="Awaiting Divorce">Awaiting Divorce</option>
                  </select>
                  {errors.maritalStatus && <p className="mt-1 text-xs text-red-600">{errors.maritalStatus.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input type="text" {...register('state')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input type="text" {...register('country')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Education Details */}
          {activeStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 3: Education Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Highest Qualification / Degree *</label>
                  <input type="text" {...register('degree', { required: 'Highest qualification is required' })} placeholder="e.g. B.Tech, MBA" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                  {errors.degree && <p className="mt-1 text-xs text-red-600">{errors.degree.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specialization</label>
                  <input type="text" placeholder="e.g. Computer Science" {...register('specialization')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">College / University</label>
                  <input type="text" {...register('college')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Graduation Year</label>
                  <input type="number" {...register('graduationYear')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Career Details */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 4: Career & Occupation Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Occupation / Profession *</label>
                  <input type="text" {...register('occupation', { required: 'Occupation is required' })} placeholder="e.g. Software Engineer, Business Owner" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                  {errors.occupation && <p className="mt-1 text-xs text-red-600">{errors.occupation.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Employer / Company Name</label>
                  <input type="text" {...register('company')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Designation</label>
                  <input type="text" {...register('designation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Annual Income / Salary (INR / USD)</label>
                  <input type="number" placeholder="e.g. 1500000" {...register('salary')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Work Location</label>
                  <input type="text" {...register('workLocation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Family Details */}
          {activeStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 5: Family Background</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                  <input type="text" {...register('father')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Father's Occupation</label>
                  <input type="text" {...register('fatherOccupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                  <input type="text" {...register('mother')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mother's Occupation</label>
                  <input type="text" {...register('motherOccupation')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Type</label>
                  <select {...register('familyType')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Type</option>
                    <option value="Nuclear">Nuclear Family</option>
                    <option value="Joint">Joint Family</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Values</label>
                  <select {...register('familyValues')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Values</option>
                    <option value="Orthodox">Orthodox</option>
                    <option value="Traditional">Traditional</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Liberal">Liberal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Siblings Count</label>
                  <input type="number" {...register('siblingsCount')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Siblings Details / Remarks</label>
                  <textarea rows={2} {...register('siblings')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Partner Preferences */}
          {activeStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 6: Partner Preferences</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Target Age Range *</label>
                  <input type="text" placeholder="e.g. 25-30" {...register('ageRange', { required: 'Age preference is required' })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                  {errors.ageRange && <p className="mt-1 text-xs text-red-600">{errors.ageRange.message as string}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age Filter Importance</label>
                  <select {...register('agePriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have (Hard Filter)</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height Preference</label>
                  <input type="text" placeholder="e.g. 5' 0&quot; - 5' 5&quot;" {...register('heightRange')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height Filter Importance</label>
                  <select {...register('heightPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have (Hard Filter)</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Religion Preference</label>
                  <input type="text" {...register('religionPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Religion Filter Importance</label>
                  <select {...register('religionPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have (Hard Filter)</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Caste Preference</label>
                  <input type="text" {...register('castePreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Caste Filter Importance</label>
                  <select {...register('castePriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have (Hard Filter)</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Preferred Education</label>
                  <input type="text" {...register('educationPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Education Filter Importance</label>
                  <select {...register('educationPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have (Hard Filter)</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Smoking Preference</label>
                  <select {...register('smokingPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Doesn't Matter</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Smoking Importance</label>
                  <select {...register('smokingPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drinking Preference</label>
                  <select {...register('drinkingPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Doesn't Matter</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drinking Importance</label>
                  <select {...register('drinkingPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Children Preference</label>
                  <select {...register('childrenPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Doesn't Matter</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Undecided">Undecided</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Children Importance</label>
                  <select {...register('childrenPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Setup Preference</label>
                  <select {...register('familySetupPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Doesn't Matter</option>
                    <option value="Joint family">Joint family</option>
                    <option value="Nuclear family">Nuclear family</option>
                    <option value="Either">Either</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Family Setup Importance</label>
                  <select {...register('familySetupPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relocation Preference</label>
                  <select {...register('relocationPreference')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Doesn't Matter</option>
                    <option value="Abroad">Abroad</option>
                    <option value="Flexible">Flexible</option>
                    <option value="Metro city">Metro city</option>
                    <option value="Current city">Current city</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relocation Importance</label>
                  <select {...register('relocationPriority')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="MUST_HAVE">Must Have</option>
                    <option value="IMPORTANT">Important</option>
                    <option value="PREFERRED">Preferred</option>
                    <option value="DOESNT_MATTER">Doesn't Matter</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: Lifestyle Details (Optional) */}
          {activeStep === 7 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Step 7: Lifestyle Details (Optional)</h2>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2.5 py-0.5 rounded bg-gray-100">Optional</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Food Habits</label>
                  <select {...register('foodHabit')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Habit</option>
                    <option value="Vegetarian">Vegetarian</option>
                    <option value="Non-Vegetarian">Non-Vegetarian</option>
                    <option value="Eggetarian">Eggetarian</option>
                    <option value="Vegan">Vegan</option>
                    <option value="Jain">Jain</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fitness Levels</label>
                  <select {...register('fitnessLevel')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="">Select Fitness</option>
                    <option value="Sedentary">Sedentary</option>
                    <option value="Average">Average</option>
                    <option value="Active">Active</option>
                    <option value="Athletic">Athletic</option>
                    <option value="Gym Enthusiast">Gym Enthusiast</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Smoking Habit</label>
                  <select {...register('smoking')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Drinking Habit</label>
                  <select {...register('drinking')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Hobbies & Hobbies list (comma separated)</label>
                  <input type="text" placeholder="e.g. Reading, Hiking, Cooking" {...register('hobbies')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 8: Compatibility Questionnaire (Optional) */}
          {activeStep === 8 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Step 8: Compatibility Match Questionnaire</h2>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2.5 py-0.5 rounded bg-gray-100">Optional</span>
              </div>

              {/* Progress Tracker */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div className="text-sm text-indigo-900">
                  <strong>Questionnaire Progress:</strong> {answeredCount} of {dbQuestions.length} questions answered
                </div>
                <div className="w-full sm:w-60 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.round((answeredCount / (dbQuestions.length || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {dbQuestions.length === 0 ? (
                <p className="text-sm italic text-gray-500 py-6 text-center">No matchmaking questions configured in the database.</p>
              ) : (
                <div className="space-y-12">
                  {Object.entries(groupedQuestions).map(([category, questions]: [string, any[]]) => (
                    <div key={category} className="space-y-6 border-b border-gray-100 pb-8 last:border-b-0 last:pb-0">
                      <h3 className="text-base font-bold text-gray-900 border-l-4 border-indigo-600 pl-3 mb-4">{category}</h3>
                      <div className="space-y-6">
                        {questions.map((q: any) => (
                          <div key={q.id} className="p-4 border rounded-md border-gray-200 bg-gray-50/50">
                            <h4 className="text-sm font-semibold text-gray-800 mb-3">{q.questionText}</h4>
                            
                            {q.type === 'LONG_TEXT' ? (
                              <div className="mb-4">
                                <textarea
                                  rows={3}
                                  {...register(`questionAnswers.${q.id}.textAnswer`)}
                                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2.5 text-gray-900 bg-white"
                                  placeholder="Provide your detailed expectation or thoughts here..."
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
          )}

          {/* STEP 9: Photos & Documents (Optional) */}
          {activeStep === 9 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-3 mb-6">
                <h2 className="text-xl font-bold text-gray-900">Step 9: Photos & Identification Documents</h2>
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2.5 py-0.5 rounded bg-gray-100">Optional</span>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Profile Photos</h3>
                <div className="border border-dashed border-gray-300 rounded p-6 text-center bg-gray-50">
                  <svg className="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <label className="block text-xs font-semibold text-indigo-600 mt-2 hover:underline cursor-pointer">
                    Click to add files
                    <input 
                      type="file" 
                      multiple 
                      className="sr-only" 
                      onChange={() => setValue('photoPrimary', 'mock_photo_primary.png')}
                    />
                  </label>
                  <p className="text-[10px] text-gray-400 mt-1">Accepts PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">Verification Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['ID_PROOF', 'EDUCATION', 'INCOME', 'BIODATA'].map((docType) => (
                    <label key={docType} className="flex items-center gap-3 p-3 border rounded bg-gray-50 hover:bg-gray-100 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={watchedFields.documentsUploaded.includes(docType)}
                        onChange={(e) => {
                          const current = getValues('documentsUploaded') || [];
                          if (e.target.checked) {
                            setValue('documentsUploaded', [...current, docType]);
                          } else {
                            setValue('documentsUploaded', current.filter(t => t !== docType));
                          }
                        }}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 rounded"
                      />
                      <span className="text-xs font-medium text-gray-700">{docType.replace('_', ' ')} Uploaded</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 10: Review & Submit */}
          {activeStep === 10 && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 border-b pb-3 mb-6">Step 10: Review & Final Submission</h2>
              
              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 flex items-center gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-indigo-600 shrink-0" />
                <div className="text-xs text-indigo-900">
                  Profile progress summary: **{stats.percentage}% complete**. Review the section checklist below before submitting.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(stats.sections).map(([name, isDone]) => (
                  <div key={name} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 transition-colors">
                    <span className="text-xs font-semibold text-gray-700">{name}</span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded ${
                      isDone ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {isDone ? 'COMPLETED' : 'INCOMPLETE'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleSaveDraftOnly}
                  disabled={saveDraftMutation.isPending}
                  className="px-4 py-2 border rounded text-xs font-semibold hover:bg-gray-50"
                >
                  Save Draft Progress
                </button>
                <button
                  type="button"
                  onClick={() => submitReviewMutation.mutate()}
                  disabled={submitReviewMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-500 flex items-center gap-2"
                >
                  <PlayIcon className="h-4 w-4" /> Submit Matrimonial Review
                </button>
              </div>
            </div>
          )}

          {/* Navigation Control Buttons */}
          <div className="mt-8 pt-6 border-t flex justify-between gap-4">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={activeStep === 1}
              className="px-4 py-2 border rounded text-xs font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Previous Step
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSaveDraftOnly}
                disabled={saveDraftMutation.isPending}
                className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded text-xs font-semibold hover:bg-indigo-50 disabled:opacity-50"
              >
                {saveDraftMutation.isPending ? 'Syncing...' : 'Save Draft'}
              </button>
              {activeStep < 10 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-500"
                >
                  Save & Continue →
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default function AgencyCreateProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <CreateProfileWizard />
    </Suspense>
  );
}