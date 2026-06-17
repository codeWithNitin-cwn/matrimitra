import api from './api';

export interface Client {
  id: string;
  clientCode: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  mobile: string;
  address: string | null;
  status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  leadSource: string | null;
  assignedUserId: string | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  updatedAt: string;
  assignedUser?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
  _count?: {
    profiles: number;
  };
  profiles?: any[];
}

export interface CreateClientInput {
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  mobile: string;
  address?: string | null;
  status?: 'LEAD' | 'ACTIVE' | 'INACTIVE';
  leadSource?: string | null;
  assignedUserId?: string | null;
  nextFollowUpAt?: string | null;
}

export interface ClientNote {
  id: string;
  clientId: string;
  authorId: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
  } | null;
}

export const ClientService = {
  async getClients(): Promise<Client[]> {
    const response = await api.get('/clients');
    return response.data?.data || [];
  },

  async getClientById(id: string): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data?.data;
  },

  async createClient(data: CreateClientInput): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data?.data;
  },

  async updateClient(id: string, data: Partial<CreateClientInput>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data?.data;
  },

  async getClientNotes(clientId: string): Promise<ClientNote[]> {
    const response = await api.get(`/clients/${clientId}/notes`);
    return response.data?.data || [];
  },

  async addClientNote(clientId: string, content: string): Promise<ClientNote> {
    const response = await api.post(`/clients/${clientId}/notes`, { content });
    return response.data?.data;
  },

  async getClientPayments(clientId: string): Promise<Payment[]> {
    const response = await api.get(`/clients/${clientId}/payments`);
    return response.data?.data || [];
  },

  async addClientPayment(clientId: string, data: CreatePaymentInput): Promise<Payment> {
    const response = await api.post(`/clients/${clientId}/payments`, data);
    return response.data?.data;
  }
};

export interface Payment {
  id: string;
  clientId: string;
  agencyId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string | null;
  transactionId: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentInput {
  amount: number;
  currency?: string;
  status?: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod?: string | null;
  transactionId?: string | null;
  remarks?: string | null;
}
