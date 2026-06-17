import api from './api';

export const MatchService = {
  async searchMatches(profileId: string) {
    const response = await api.get(`/matches/search/${profileId}`);
    return response.data?.data || [];
  }
};
