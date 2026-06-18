"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClientService } from "@/modules/clients/client.service";
import toast from "react-hot-toast";

// Static Matrimonial Package Value for Outstanding Calculation
const PACKAGE_VALUE = 30000; 

export default function ClientDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profiles" | "notes" | "payments">("profiles");
  const [newNoteContent, setNewNoteContent] = useState("");

  // Payment Form State
  const [amount, setAmount] = useState<number>(0);
  const [currency, setCurrency] = useState("INR");
  const [status, setStatus] = useState<"PENDING" | "COMPLETED" | "FAILED" | "REFUNDED">("PENDING");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [remarks, setRemarks] = useState("");

  const { data: client, isPending, isError, error } = useQuery({
    queryKey: ["client", id],
    queryFn: () => ClientService.getClientById(id),
    enabled: !!id,
  });

  const { data: notes = [], isPending: isNotesPending, isError: isNotesError, error: notesError } = useQuery({
    queryKey: ["clientNotes", id],
    queryFn: () => ClientService.getClientNotes(id),
    enabled: !!id && activeTab === "notes",
  });

  const { data: payments = [], isPending: isPaymentsPending, isError: isPaymentsError, error: paymentsError } = useQuery({
    queryKey: ["clientPayments", id],
    queryFn: () => ClientService.getClientPayments(id),
    enabled: !!id && activeTab === "payments",
  });

  const addNoteMutation = useMutation({
    mutationFn: (content: string) => ClientService.addClientNote(id, content),
    onSuccess: () => {
      toast.success("Note added successfully!");
      setNewNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["clientNotes", id] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to add note.";
      toast.error(msg);
    },
  });

  const addPaymentMutation = useMutation({
    mutationFn: (data: any) => ClientService.addClientPayment(id, data),
    onSuccess: () => {
      toast.success("Payment recorded successfully!");
      setAmount(0);
      setPaymentMethod("");
      setTransactionId("");
      setRemarks("");
      setStatus("PENDING");
      queryClient.invalidateQueries({ queryKey: ["clientPayments", id] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || "Failed to record payment.";
      toast.error(msg);
    },
  });

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) {
      toast.error("Note content cannot be empty.");
      return;
    }
    addNoteMutation.mutate(newNoteContent.trim());
  };

  const handleAddPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero.");
      return;
    }
    addPaymentMutation.mutate({
      amount: Number(amount),
      currency,
      status,
      paymentMethod: paymentMethod.trim() || null,
      transactionId: transactionId.trim() || null,
      remarks: remarks.trim() || null,
    });
  };

  // Calculations
  const totalPaid = payments
    .filter((p) => p.status === "COMPLETED")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const outstandingAmount = Math.max(0, PACKAGE_VALUE - totalPaid);

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading client details...</span>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200 text-red-700">
        <h3 className="font-semibold">Error loading client</h3>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : "Client not found or unauthorized."}</p>
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
    <div className="container mx-auto max-w-4xl py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Header breadcrumb & Edit button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <Link href="/dashboard/clients" className="hover:underline">Clients</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{client.clientCode}</span>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">
            {client.firstName} {client.lastName || ""}
          </h1>
        </div>

        <Link
          href={`/dashboard/clients/${client.id}/edit`}
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
        >
          Edit Client
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Main Info Column */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 border-b pb-2">CRM Metadata</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Client Code</span>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{client.clientCode}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Status</span>
                <div className="mt-0.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    client.status === 'LEAD' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {client.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Mobile</span>
                <p className="text-sm text-gray-900 mt-0.5">{client.mobile}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-400 uppercase">Email</span>
                <p className="text-sm text-gray-900 mt-0.5">{client.email || "—"}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Address</span>
                <p className="text-sm text-gray-900 mt-0.5 whitespace-pre-line">{client.address || "—"}</p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="border-b border-gray-200 bg-gray-50">
              <nav className="flex -mb-px" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("profiles")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "profiles"
                      ? "border-indigo-500 text-indigo-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Profiles
                </button>
                <button
                  onClick={() => setActiveTab("notes")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "notes"
                      ? "border-indigo-500 text-indigo-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Timeline Notes
                </button>
                <button
                  onClick={() => setActiveTab("payments")}
                  className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "payments"
                      ? "border-indigo-500 text-indigo-600 bg-white"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  Payment Tracking
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Profiles Tab Content */}
              {activeTab === "profiles" && (
                <div>
                  {(!client.profiles || client.profiles.length === 0) ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500 text-sm font-medium">No profiles linked to this client.</p>
                      <p className="text-gray-400 text-xs mt-1">Matrimonial profiles can be created and linked in the Matchmaking layer.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {client.profiles.map((profile: any) => (
                        <div key={profile.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors border-gray-200">
                          <div>
                            <p className="text-sm font-semibold text-indigo-600">{profile.profileNumber}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Type: {profile.profileType}{profile.relationshipToClient ? ` (${profile.relationshipToClient})` : ''} | Status: {profile.status}</p>
                          </div>
                          <Link
                            href={`/dashboard/profiles/${profile.id}`}
                            className="inline-flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-900"
                          >
                            View Profile →
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Notes Tab Content */}
              {activeTab === "notes" && (
                <div className="space-y-6">
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNoteSubmit} className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Add Timeline Note</label>
                    <textarea
                      rows={3}
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Type client update or interaction note here..."
                      className="w-full border rounded-lg p-3 text-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300"
                      required
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addNoteMutation.isPending}
                        className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {addNoteMutation.isPending ? "Adding..." : "Add Note"}
                      </button>
                    </div>
                  </form>

                  {/* Notes Timeline List */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-bold text-gray-900 mb-4">History Timeline</h3>
                    
                    {isNotesPending ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                      </div>
                    ) : isNotesError ? (
                      <p className="text-sm text-red-600">
                        {notesError instanceof Error ? notesError.message : "Failed to load notes."}
                      </p>
                    ) : notes.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">No notes recorded yet.</p>
                    ) : (
                      <div className="flow-root">
                        <ul role="list" className="-mb-8">
                          {notes.map((note, noteIdx) => (
                            <li key={note.id}>
                              <div className="relative pb-8">
                                {noteIdx !== notes.length - 1 ? (
                                  <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                                ) : null}
                                <div className="relative flex space-x-3">
                                  <div>
                                    <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                                      <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                      </svg>
                                    </span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm text-gray-500 flex justify-between items-center">
                                      <span className="font-semibold text-gray-800">
                                        {note.author ? `${note.author.firstName} ${note.author.lastName || ""}` : "System / Agent"}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {new Date(note.createdAt).toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-line">
                                      {note.content}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payments Tab Content */}
              {activeTab === "payments" && (
                <div className="space-y-6">
                  {/* Financial Overview Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                      <span className="text-xs font-semibold text-gray-400 uppercase">Package Value</span>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{PACKAGE_VALUE.toLocaleString()} INR</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                      <span className="text-xs font-semibold text-green-600 uppercase">Total Paid</span>
                      <p className="text-2xl font-bold text-green-800 mt-1">{totalPaid.toLocaleString()} INR</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                      <span className="text-xs font-semibold text-red-600 uppercase">Outstanding</span>
                      <p className="text-2xl font-bold text-red-800 mt-1">{outstandingAmount.toLocaleString()} INR</p>
                    </div>
                  </div>

                  {/* Add Payment Form */}
                  <form onSubmit={handleAddPaymentSubmit} className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                    <h3 className="text-sm font-bold text-gray-900">Record New Payment</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Amount *</label>
                        <input
                          type="number"
                          value={amount || ""}
                          onChange={(e) => setAmount(Number(e.target.value))}
                          placeholder="Amount"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Status</label>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value as any)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-2"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="FAILED">Failed</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Payment Method</label>
                        <input
                          type="text"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          placeholder="e.g. UPI, Bank Transfer"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-2"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Transaction ID</label>
                        <input
                          type="text"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="TXN ID"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-2"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Remarks</label>
                        <input
                          type="text"
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Notes about payment"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-xs border p-2"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={addPaymentMutation.isPending}
                        className="inline-flex justify-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors disabled:opacity-50"
                      >
                        {addPaymentMutation.isPending ? "Recording..." : "Record Payment"}
                      </button>
                    </div>
                  </form>

                  {/* Payments History Table */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-md font-bold text-gray-900 mb-4">Payment History</h3>
                    {isPaymentsPending ? (
                      <div className="flex justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                      </div>
                    ) : isPaymentsError ? (
                      <p className="text-sm text-red-600">
                        {paymentsError instanceof Error ? paymentsError.message : "Failed to load payments."}
                      </p>
                    ) : payments.length === 0 ? (
                      <p className="text-sm text-gray-500 italic text-center py-4">No payments recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 text-xs text-left">
                          <thead className="bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Amount</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="px-4 py-3">TXN ID</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 text-gray-900">
                            {payments.map((payment) => (
                              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {new Date(payment.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-medium">
                                  {Number(payment.amount).toLocaleString()} {payment.currency}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  {payment.paymentMethod || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-gray-500">
                                  {payment.transactionId || "—"}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-medium uppercase ${
                                    payment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                    payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    payment.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {payment.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3 max-w-xs truncate text-gray-500">
                                  {payment.remarks || "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Actions/Executive Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Assigned Executive</h2>
            {client.assignedUser ? (
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {client.assignedUser.firstName} {client.assignedUser.lastName || ""}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{client.assignedUser.email}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No executive assigned.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">CRM Details</h2>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase">Lead Source</span>
                <span className="text-gray-900 font-medium">{client.leadSource || "Direct / Unknown"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase">Next Follow-Up</span>
                <span className="text-gray-900 font-medium">
                  {client.nextFollowUpAt ? new Date(client.nextFollowUpAt).toLocaleString() : "None scheduled"}
                </span>
              </div>
              <div>
                <span className="text-xs text-gray-400 block font-semibold uppercase">Created At</span>
                <span className="text-gray-500 font-medium">{new Date(client.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
