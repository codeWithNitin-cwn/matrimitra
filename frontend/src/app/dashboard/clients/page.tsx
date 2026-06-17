"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ClientService } from "@/services/client.service";

export default function ClientsPage() {
  const { data: clients = [], isPending, isError, error } = useQuery({
    queryKey: ["clients"],
    queryFn: () => ClientService.getClients(),
  });

  const [searchTerm, setSearchTerm] = useState("");

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client: any) => {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${client.firstName || ""} ${client.lastName || ""}`.trim().toLowerCase();
      const mobile = (client.mobile || "").toLowerCase();
      const clientCode = (client.clientCode || "").toLowerCase();

      return (
        fullName.includes(searchLower) ||
        mobile.includes(searchLower) ||
        clientCode.includes(searchLower)
      );
    });
  }, [clients, searchTerm]);

  if (isPending) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <span className="ml-3 text-gray-600">Loading clients...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-md bg-red-50 p-4 border border-red-200 text-red-700">
        <h3 className="font-semibold">Error loading clients</h3>
        <p className="text-sm mt-1">{error instanceof Error ? error.message : "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and track your lead and active matrimonial clients.</p>
        </div>

        <Link
          href="/dashboard/clients/create"
          className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors"
        >
          + Create Client
        </Link>
      </div>

      {/* Search Input Section */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, mobile, or client ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border border-gray-300 rounded-md px-4 py-2.5 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
        />
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 font-medium">No clients found matching the search criteria.</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new client.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Client Code</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profiles</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client: any) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600">
                    <Link href={`/dashboard/clients/${client.id}`} className="hover:underline">
                      {client.clientCode}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {client.firstName} {client.lastName || ""}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.mobile}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.email || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      client.status === 'LEAD' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client._count?.profiles ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <Link href={`/dashboard/clients/${client.id}`} className="text-indigo-600 hover:text-indigo-900">
                      View
                    </Link>
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="text-gray-600 hover:text-gray-900">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}