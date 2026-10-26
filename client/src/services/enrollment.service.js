import api from './api';

export const enrollmentService = {
  async createEnrollment(data) {
    const response = await api.post('/enrollments', data);
    return response.data || response;
  },

  async getMyEnrollments() {
    const response = await api.get('/enrollments/mine');
    return response.data || response;
  },

  async getEnrollmentById(id) {
    const response = await api.get(`/enrollments/${id}`);
    return response.data || response;
  },

  async cancelEnrollment(id) {
    const response = await api.patch(`/enrollments/${id}/cancel`);
    return response.data || response;
  },

  async getAdminEnrollments(params = {}) {
    const response = await api.get('/admin/enrollments', { params });
    return response.data || response;
  },

  async getPendingCount() {
    const response = await api.get('/admin/enrollments/pending-count');
    return response.data || response;
  },

  async reviewEnrollment(id, data) {
    const response = await api.patch(`/admin/enrollments/${id}`, data);
    return response.data || response;
  },
};

export default enrollmentService;
