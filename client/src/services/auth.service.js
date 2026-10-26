import api from './api';

export const authService = {
  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data || response;
  },

  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    return response.data || response;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data || response;
  },

  async updateProfile(data) {
    const response = await api.patch('/auth/me', data);
    return response.data || response;
  },

  async changePassword(data) {
    const response = await api.patch('/auth/change-password', data);
    return response.data || response;
  },

  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  async resetPassword(data) {
    const response = await api.post('/auth/reset-password', data);
    return response;
  },
};

export default authService;
