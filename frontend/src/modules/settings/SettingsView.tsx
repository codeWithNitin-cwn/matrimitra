'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/auth.store';
import { UserService, AgencyUser, CreateAgencyUserInput, UpdateAgencyUserInput } from './userService';

export default function SettingsView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AgencyUser | null>(null);

  // Form states
  const [addForm, setAddForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    mobile: '',
    password: '',
    role: 'PROFILE_MANAGER' as CreateAgencyUserInput['role']
  });

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    username: '',
    password: '',
    role: 'PROFILE_MANAGER' as UpdateAgencyUserInput['role'],
    status: 'ACTIVE' as UpdateAgencyUserInput['status']
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch users (only if OWNER)
  const isOwner = user?.role === 'OWNER';
  const { data: users = [], isPending, isError, error } = useQuery({
    queryKey: ['agency-users'],
    queryFn: () => UserService.getUsers(),
    enabled: isOwner,
  });

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: (data: CreateAgencyUserInput) => UserService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      setIsAddModalOpen(false);
      setAddForm({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        mobile: '',
        password: '',
        role: 'PROFILE_MANAGER'
      });
      showNotification('User created successfully');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to create user');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAgencyUserInput }) => UserService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agency-users'] });
      setIsEditModalOpen(false);
      setSelectedUser(null);
      showNotification('User updated successfully');
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error?.message || err.message || 'Failed to update user');
    }
  });

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!user?.agencyId) return;

    createUserMutation.mutate({
      ...addForm,
      agencyId: user.agencyId,
      lastName: addForm.lastName || null,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!selectedUser) return;

    const payload: UpdateAgencyUserInput = {
      firstName: editForm.firstName,
      lastName: editForm.lastName || null,
      email: editForm.email,
      mobile: editForm.mobile,
      username: editForm.username,
      role: editForm.role,
      status: editForm.status
    };

    if (editForm.password) {
      payload.password = editForm.password;
    }

    updateUserMutation.mutate({
      id: selectedUser.id,
      data: payload
    });
  };

  const openEditModal = (targetUser: AgencyUser) => {
    setSelectedUser(targetUser);
    setEditForm({
      firstName: targetUser.firstName,
      lastName: targetUser.lastName || '',
      email: targetUser.email,
      mobile: targetUser.mobile,
      username: targetUser.username,
      password: '',
      role: targetUser.role,
      status: targetUser.status
    });
    setErrorMsg('');
    setIsEditModalOpen(true);
  };

  const handleStatusToggle = (targetUser: AgencyUser) => {
    if (targetUser.id === user?.id) {
      alert("You cannot deactivate your own account.");
      return;
    }
    const newStatus = targetUser.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    updateUserMutation.mutate({
      id: targetUser.id,
      data: { status: newStatus }
    });
  };

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchTerm.toLowerCase();
      return (
        u.firstName.toLowerCase().includes(query) ||
        (u.lastName && u.lastName.toLowerCase().includes(query)) ||
        u.username.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)
      );
    });
  }, [users, searchTerm]);

  if (!isOwner) {
    return (
      <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <div className="mt-6 p-4 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800">
          <p className="font-medium">Access Restricted</p>
          <p className="text-sm mt-1">User management settings are only available to users with the OWNER role.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-green-50 p-4 border border-green-200 text-green-800 shadow-lg animate-fade-in-down">
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <div className="p-6 bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">Manage agency staff roles, details, and active status.</p>
          </div>
          <button
            onClick={() => {
              setErrorMsg('');
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-colors self-start sm:self-auto"
          >
            + Add User
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border border-gray-300 rounded-md px-4 py-2 text-sm w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
          />
        </div>

        {isPending ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <span className="ml-3 text-gray-600">Loading users...</span>
          </div>
        ) : isError ? (
          <div className="rounded-md bg-red-50 p-4 border border-red-200 text-red-700">
            <h3 className="font-semibold">Error loading users</h3>
            <p className="text-sm mt-1">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-gray-500 font-medium">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.firstName} {u.lastName || ''}
                      {u.id === user?.id && <span className="ml-2 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-normal">You</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.mobile}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Edit
                      </button>
                      {u.id !== user?.id && (
                        <button
                          onClick={() => handleStatusToggle(u)}
                          className={`${u.status === 'ACTIVE' ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {u.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add Agency User</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{errorMsg}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={addForm.username}
                    onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={addForm.firstName}
                      onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={addForm.lastName}
                      onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <input
                    type="text"
                    required
                    value={addForm.mobile}
                    onChange={(e) => setAddForm({ ...addForm, mobile: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value as CreateAgencyUserInput['role'] })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="PROFILE_MANAGER">Profile Manager</option>
                    <option value="MATCHING_MANAGER">Matching Manager</option>
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                  </select>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createUserMutation.isPending}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    {createUserMutation.isPending ? 'Saving...' : 'Add User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="relative z-50 inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6 border border-gray-200">
              <div className="flex justify-between items-center pb-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Agency User</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-500">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{errorMsg}</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      required
                      value={editForm.firstName}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile</label>
                  <input
                    type="text"
                    required
                    value={editForm.mobile}
                    onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editForm.role}
                    disabled={selectedUser.id === user?.id}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UpdateAgencyUserInput['role'] })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                  >
                    <option value="OWNER">Owner</option>
                    <option value="PROFILE_MANAGER">Profile Manager</option>
                    <option value="MATCHING_MANAGER">Matching Manager</option>
                    <option value="RELATIONSHIP_MANAGER">Relationship Manager</option>
                  </select>
                  {selectedUser.id === user?.id && (
                    <span className="text-xs text-gray-400 mt-1 block">You cannot change your own role.</span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={editForm.status}
                    disabled={selectedUser.id === user?.id}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value as UpdateAgencyUserInput['status'] })}
                    className="mt-1 block w-full bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-60"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                  {selectedUser.id === user?.id && (
                    <span className="text-xs text-gray-400 mt-1 block">You cannot deactivate your own account.</span>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none disabled:opacity-50"
                  >
                    {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
