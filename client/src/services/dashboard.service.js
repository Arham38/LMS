import api from './api';

export const dashboardService = {
  async getAdminStats() {
    const response = await api.get('/admin/stats');
    return response.data || response;
  },

  async getStudentDashboard() {
    const response = await api.get('/student/dashboard');
    return response.data || response;
  },
};

export default dashboardService;
