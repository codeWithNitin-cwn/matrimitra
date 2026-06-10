import api from './api';

export interface DashboardStats {
  totalAgencies: number;
  totalProfiles: number;
  totalProposals: number;
  acceptedProposals: number;
  rejectedProposals: number;
  activePipelines: number;
}

interface ApiResponse {
  success: boolean;
  data: DashboardStats;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse>('/api/v1/reports/dashboard');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();