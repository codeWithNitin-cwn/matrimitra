import api from './api';

export interface DashboardStats {
  totalProfiles: number;
  approvedProfiles: number;
  pendingProfiles: number;
  totalClients: number;
  matchesGenerated: number;
  proposalsSent: number;
  acceptedProposals: number;
  rejectedProposals: number;
  activePipelines: number;
  conversionRate: number;
  matchConversionRate: number;
  pendingApprovalProfiles?: any[];
  pendingReceivedProposals?: any[];
  recentActivities?: any[];
  aiRecommendations?: any[];
  mostViewedProfiles?: any[];
  neverViewedProfiles?: any[];
  todaysFollowUps?: any[];
  overdueFollowUps?: any[];
  upcomingFollowUps?: any[];
  followUpCompletionRate?: number;
}

interface ApiResponse {
  success: boolean;
  data: DashboardStats;
}

class DashboardService {
  async getStats(): Promise<DashboardStats> {
    const response = await api.get<ApiResponse>('/reports/dashboard');
    return response.data.data;
  }
}

export const dashboardService = new DashboardService();