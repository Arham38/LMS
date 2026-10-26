import api from './api';

export const gradebookService = {
  async getAdminGradebook(courseId) {
    const response = await api.get(`/admin/courses/${courseId}/gradebook`);
    return response.data || response;
  },

  getExportCSVUrl(courseId) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base}/admin/courses/${courseId}/gradebook/export`;
  },

  async getMyGrades(courseId) {
    const response = await api.get(`/student/courses/${courseId}/grades`);
    return response.data || response;
  },
};

export default gradebookService;
