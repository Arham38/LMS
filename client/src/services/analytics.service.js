import api from './api';

export const analyticsService = {
  /**
   * Fetch aggregated analytics and cohort telemetry
   * @param {Object} params - { courseId }
   */
  async getAdminAnalytics(params = {}) {
    const response = await api.get('/admin/analytics', { params });
    return response.data || response;
  },
};

export default analyticsService;
