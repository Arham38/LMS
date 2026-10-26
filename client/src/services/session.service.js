import api from './api';

export const sessionService = {
  // Admin Endpoints
  async getCourseSessionsAdmin(courseId) {
    const response = await api.get(`/admin/courses/${courseId}/sessions`);
    return response.data || response;
  },

  async createSessionAdmin(courseId, data) {
    const response = await api.post(`/admin/courses/${courseId}/sessions`, data);
    return response.data || response;
  },

  async getSessionByIdAdmin(id) {
    const response = await api.get(`/admin/sessions/${id}`);
    return response.data || response;
  },

  async updateSessionAdmin(id, data) {
    const response = await api.put(`/admin/sessions/${id}`, data);
    return response.data || response;
  },

  async deleteSessionAdmin(id) {
    const response = await api.delete(`/admin/sessions/${id}`);
    return response.data || response;
  },

  async updateSessionStatusAdmin(id, status) {
    const response = await api.patch(`/admin/sessions/${id}/status`, { status });
    return response.data || response;
  },

  async getSessionAttendanceAdmin(id) {
    const response = await api.get(`/admin/sessions/${id}/attendance`);
    return response.data || response;
  },

  async updateSessionAttendanceAdmin(id, attendance) {
    const response = await api.put(`/admin/sessions/${id}/attendance`, { attendance });
    return response.data || response;
  },

  async getTodaySessionsAdmin() {
    const response = await api.get('/admin/sessions/today');
    return response.data || response;
  },

  // Student Endpoints
  async getCourseSessionsStudent(courseId) {
    const response = await api.get(`/courses/${courseId}/sessions`);
    return response.data || response;
  },

  async joinSessionStudent(id) {
    const response = await api.post(`/sessions/${id}/join`);
    return response.data || response;
  },

  async getMyCourseAttendanceStudent(courseId) {
    const response = await api.get(`/courses/${courseId}/my-attendance`);
    return response.data || response;
  },
};

export default sessionService;
