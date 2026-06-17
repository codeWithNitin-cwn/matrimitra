"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientService } from "@/services/client.service";
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
}

export default function EditClientPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [apiError, setApiError] = useState<string | null>(null);

  const { data: client, isPending, isError, error } = useQuery({
    queryKey: ["client", id],
    queryFn: () => ClientService.getClientById(id),
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ClientFormInputs>();

  useEffect(() => {
    if (client) {
      setValue("firstName", client.firstName);
      setValue("lastName", client.lastName || "");
      setValue("email", client.email || "");
      setValue("mobile", client.mobile);
      setValue("address", client.address || "");
      setValue("status", client.status);
      setValue("leadSource", (client.leadSource || "") as any);
      setValue("assignedUserId", client.assignedUserId || "");
      
      if (client.nextFollowUpAt) {
        // Format ISO date to YYYY-MM-DDTHH:MM for datetime-local input
        const date = new Date(client.nextFollowUpAt);
        const formattedDate = date.toISOString().slice(0, 16);
        setValue("nextFollowUpAt", formattedDate);
      } else {
        setValue("nextFollowUpAt", "");
      }
    }
  }, [client, setValue]);

  const updateClientMutation = useMutation({
    mutationFn: (data: any) => ClientService.updateClient(id, data),
    onSuccess: () => {
      toast.success("Client updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      router.push(`/dashboard/clients/${id}`);
    },
    onError: (error: any) => {
      const message = error.response?.data?.error?.message || "Failed to update client.";
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

    updateClientMutation.mutate(payload);
  };

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading client data...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200 text-red-700">
        <h3 className="font-semibold">Error loading client</h3>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : "Client not found."}</p>
        <button
          onClick={() => router.push("/dashboard/clients")}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 font-sans">Edit Client</h1>
        <p className="mt-2 text-sm text-gray-600">
          Update matrimonial client details for {client.clientCode}.
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
              placeholder="Enter User UUID"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2.5"
            />
          </div>
        </div>

        <div className="flex justify-end gap-x-4 border-t border-gray-200 pt-6">
          <Link
            href={`/dashboard/clients/${id}`}
            className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateClientMutation.isPending}
            className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
          >
            {updateClientMutation.isPending ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
