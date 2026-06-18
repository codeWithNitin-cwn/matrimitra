import api from '../../services/api';

export const PipelineService = {
  async initializePipeline(data: {
    proposalId: string;
    currentStage: string;
    updatedBy: string;
  }) {
    const response = await api.post('/pipeline', data);
    return response.data?.data;
  },

  async getPipelineByProposal(proposalId: string) {
    const response = await api.get(`/pipeline/${proposalId}`);
    return response.data?.data;
  },

  async updatePipelineStage(proposalId: string, data: { currentStage: string; updatedBy: string; notes?: string }) {
    const response = await api.patch(`/pipeline/${proposalId}`, data);
    return response.data?.data;
  },

  async getPipelineAssistant(proposalId: string, runAI: boolean) {
    const response = await api.get(`/pipeline/${proposalId}/assistant?ai=${runAI}`);
    return response.data?.data;
  }
};
