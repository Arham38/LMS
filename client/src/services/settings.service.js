import api from './api';

export const settingsService = {
  async getPublicSettings() {
    const response = await api.get('/settings/public');
    return response.data || response;
  },

  async getAdminSettings() {
    const response = await api.get('/admin/settings');
    return response.data || response;
  },

  async updateAdminSettings(data) {
    const response = await api.put('/admin/settings', data);
    return response.data || response;
  },
};

export default settingsService;
