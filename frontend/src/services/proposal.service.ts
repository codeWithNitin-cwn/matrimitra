import api from './api';

export const ProposalService = {
  async createProposal(data: {
    senderAgencyId: string;
    receiverAgencyId: string;
    brideProfileId: string;
    groomProfileId: string;
    createdBy: string;
    proposalNotes?: string;
  }) {
    const response = await api.post('/proposals', data);
    return response.data?.data;
  },

  async getProposals() {
    const response = await api.get('/proposals');
    return response.data?.data || [];
  },

  async getProposalById(id: string) {
    const response = await api.get(`/proposals/${id}`);
    return response.data?.data;
  },

  async acceptProposal(id: string, payload: { performedBy: string; activityNotes?: string }) {
    const response = await api.patch(`/proposals/${id}/accept`, payload);
    return response.data?.data;
  },

  async rejectProposal(id: string, payload: { performedBy: string; activityNotes?: string }) {
    const response = await api.patch(`/proposals/${id}/reject`, payload);
    return response.data?.data;
  }
};
