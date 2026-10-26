import api from './api';

export const assignmentService = {
  // ==========================================
  // Admin Endpoints
  // ==========================================
  async getAdminAssignments(courseId) {
    const response = await api.get(`/admin/courses/${courseId}/assignments`);
    return response.data || response;
  },

  async createAssignment(courseId, data) {
    const response = await api.post(`/admin/courses/${courseId}/assignments`, data);
    return response.data || response;
  },

  async getAssignmentById(id) {
    const response = await api.get(`/admin/assignments/${id}`);
    return response.data || response;
  },

  async updateAssignment(id, data) {
    const response = await api.put(`/admin/assignments/${id}`, data);
    return response.data || response;
  },

  async deleteAssignment(id) {
    const response = await api.delete(`/admin/assignments/${id}`);
    return response.data || response;
  },

  async getAssignmentSubmissions(assignmentId, params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/admin/assignments/${assignmentId}/submissions${queryString}`);
    return response.data || response;
  },

  async gradeSubmission(submissionId, data) {
    const response = await api.patch(`/admin/submissions/${submissionId}/grade`, data);
    return response.data || response;
  },

  getExportCSVUrl(assignmentId) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base}/admin/assignments/${assignmentId}/export`;
  },

  // ==========================================
  // Student Endpoints
  // ==========================================
  async getCourseAssignmentsStudent(courseId) {
    const response = await api.get(`/courses/${courseId}/assignments`);
    return response.data || response;
  },

  async submitSolution(assignmentId, data) {
    const response = await api.post(`/assignments/${assignmentId}/submit`, data);
    return response.data || response;
  },

  async getMySubmission(assignmentId) {
    const response = await api.get(`/assignments/${assignmentId}/my-submission`);
    return response.data || response;
  },
};

export default assignmentService;
