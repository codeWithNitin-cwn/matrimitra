import api from '../../services/api';

export interface AgencyUser {
  id: string;
  agencyId: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string | null;
  mobile: string;
  role: 'OWNER' | 'PROFILE_MANAGER' | 'MATCHING_MANAGER' | 'RELATIONSHIP_MANAGER';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface CreateAgencyUserInput {
  agencyId: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  mobile: string;
  username: string;
  password?: string;
  role: 'OWNER' | 'PROFILE_MANAGER' | 'MATCHING_MANAGER' | 'RELATIONSHIP_MANAGER';
}

export interface UpdateAgencyUserInput {
  firstName?: string;
  lastName?: string | null;
  email?: string;
  mobile?: string;
  username?: string;
  password?: string;
  role?: 'OWNER' | 'PROFILE_MANAGER' | 'MATCHING_MANAGER' | 'RELATIONSHIP_MANAGER';
  status?: 'ACTIVE' | 'INACTIVE';
}

export const UserService = {
  async getUsers(): Promise<AgencyUser[]> {
    const response = await api.get('/agency-users');
    return response.data?.data || [];
  },

  async createUser(data: CreateAgencyUserInput): Promise<AgencyUser> {
    const response = await api.post('/agency-users', data);
    return response.data?.data;
  },

  async updateUser(id: string, data: UpdateAgencyUserInput): Promise<AgencyUser> {
    const response = await api.put(`/agency-users/${id}`, data);
    return response.data?.data;
  }
};
