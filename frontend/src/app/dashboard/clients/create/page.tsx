"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ClientService } from "@/services/client.service";
import { useAuthStore } from "@/store/auth.store";
import toast from "react-hot-toast";

interface ClientFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  address: string;
  status: "LEAD" | "ACTIVE" | "INACTIVE";
  leadSource: "" | "WEBSITE" | "REFERENCE" | "WALK_IN" | "INSTAGRAM" | "FACEBOOK" | "WHATSAPP";
  assignedUserId: string;
  nextFollowUpAt: string;
  assignToSelf: boolean;
  relationship: string;
}

export default function CreateClientPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ClientFormInputs>({
    defaultValues: {
      status: "LEAD",
      leadSource: "",
      assignToSelf: true,
      relationship: "SELF",
    },
  });

  const assignToSelf = watch("assignToSelf");

  React.useEffect(() => {
    if (assignToSelf && user?.id) {
      setValue("assignedUserId", user.id);
    } else if (!assignToSelf) {
      setValue("assignedUserId", "");
    }
  }, [assignToSelf, user, setValue]);

  const createClientMutation = useMutation({
    mutationFn: (vars: { payload: any; relationship: string }) => ClientService.createClient(vars.payload),
    onSuccess: (client: any, vars) => {
      toast.success("Client created successfully!");
      router.push(`/dashboard/profiles/create?clientId=${client.id}&relationship=${vars.relationship}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Failed to create client.";
      setApiError(message);
      toast.error(message);
    },
  });

  const onSubmit = (data: ClientFormInputs) => {
    setApiError(null);

    const payload = {
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      mobile: data.mobile,
      address: data.address || null,
      status: data.status,
      leadSource: data.leadSource || null,
      assignedUserId: data.assignedUserId || null,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt).toISOString() : null,
    };

    createClientMutation.mutate({ payload, relationship: data.relationship });
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-sans">Create Client</h1>
        <p className="mt-2 text-sm text-gray-600">
          Add a new matrimonial lead or client to the CRM layer.
        </p>
      </div>

      {apiError && (
        <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{apiError}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 bg-white p-6 shadow-md sm:rounded-lg sm:p-8 border border-gray-200"
      >
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name *</label>
            <input
              type="text"
              {...register("firstName", { required: "First name is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name</label>
            <input
              type="text"
              {...register("lastName")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
            <input
              type="tel"
              {...register("mobile", {
                required: "Mobile number is required",
                minLength: { value: 10, message: "Mobile must be at least 10 digits" },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email Address</label>
            <input
              type="email"
              {...register("email", {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              rows={3}
              {...register("address")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              {...register("status")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            >
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lead Source</label>
            <select
              {...register("leadSource")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            >
              <option value="">Select Source</option>
              <option value="WEBSITE">Website</option>
              <option value="REFERENCE">Reference</option>
              <option value="WALK_IN">Walk In</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="WHATSAPP">WhatsApp</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Next Follow-Up Date</label>
            <input
              type="datetime-local"
              {...register("nextFollowUpAt")}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned Executive ID</label>
            <input
              type="text"
              {...register("assignedUserId")}
              disabled={assignToSelf}
              placeholder="Enter User UUID"
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 disabled:opacity-75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-indigo-900 font-semibold">Matrimonial Profile Relationship *</label>
            <select
              {...register("relationship", { required: "Relationship is required" })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5 font-medium text-gray-900"
            >
              <option value="SELF">SELF</option>
              <option value="SON">SON</option>
              <option value="DAUGHTER">DAUGHTER</option>
              <option value="BROTHER">BROTHER</option>
              <option value="SISTER">SISTER</option>
              <option value="RELATIVE">RELATIVE</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-center mt-2">
            <input
              id="assignToSelf"
              type="checkbox"
              {...register("assignToSelf")}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="assignToSelf" className="ml-2 block text-sm text-gray-900">
              Assign to myself
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-x-4 border-t border-gray-200 pt-6">
          <Link
            href="/dashboard/clients"
            className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createClientMutation.isPending}
            className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
          >
            {createClientMutation.isPending ? "Creating..." : "Save Client"}
          </button>
        </div>
      </form>
    </div>
  );
}