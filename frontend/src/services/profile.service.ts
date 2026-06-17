import api from './api';

export const ProfileService = {
  async getProfiles() {
    const response = await api.get('/profiles');

    const rawData = response.data?.data || [];

    // Map the nested backend data to the flat structure the frontend table expects
    return rawData.map((item: any) => {
      let calculatedAge = 'N/A';
      const rawDob = item.person?.dob || item.person?.dateOfBirth;
      if (rawDob) {
        const birthDate = new Date(rawDob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        // Subtract 1 year if the birthday hasn't occurred yet this year
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        calculatedAge = age.toString();
      }

      return {
        ...item,
        firstName: item.person?.firstName || '',
        lastName: item.person?.lastName || '',
        gender: item.person?.gender || 'N/A',
        age: calculatedAge,
        city: item.personal?.city || 'N/A',
        maritalStatus: item.personal?.maritalStatus || 'N/A',
      };
    });
  },

  async getProfileById(id: string) {
    const response = await api.get(`/profiles/${id}`);
    return response.data?.data;
  },

  async createDraft(data: any) {
    const response = await api.post('/profiles/draft', data);
    return response.data;
  },
  async updateDraft(id: string, data: any) {
    const response = await api.put(`/profiles/${id}`, data);
    return response.data;
  },
  async updateStatus(id: string, status: string) {
    const response = await api.patch(`/profiles/${id}/status`, { status });
    return response.data;
  },
  async logAccess(id: string, action: string) {
    const response = await api.post(`/profiles/${id}/access-log`, { action });
    return response.data;
  },
};