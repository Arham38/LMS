import api from './api';

export const studentManagementService = {
  async getStudents(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.isActive !== undefined && params.isActive !== '') query.append('isActive', params.isActive);
    if (params.courseId) query.append('courseId', params.courseId);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/admin/students${qs}`);
    return response.data || response;
  },

  async getStudentById(id) {
    const response = await api.get(`/admin/students/${id}`);
    return response.data || response;
  },

  async updateStudentStatus(id, isActive) {
    const response = await api.patch(`/admin/students/${id}/status`, { isActive });
    return response.data || response;
  },

  async updateStudentNotes(id, privateNotes) {
    const response = await api.put(`/admin/students/${id}/notes`, { privateNotes });
    return response.data || response;
  },
};

export default studentManagementService;
