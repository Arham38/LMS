import api from './api';

export const quizService = {
  // Admin Endpoints
  async getAdminQuizzes(courseId) {
    const response = await api.get(`/admin/courses/${courseId}/quizzes`);
    return response.data || response;
  },

  async createQuiz(courseId, data) {
    const response = await api.post(`/admin/courses/${courseId}/quizzes`, data);
    return response.data || response;
  },

  async getQuizById(id) {
    const response = await api.get(`/admin/quizzes/${id}`);
    return response.data || response;
  },

  async updateQuiz(id, data) {
    const response = await api.put(`/admin/quizzes/${id}`, data);
    return response.data || response;
  },

  async deleteQuiz(id) {
    const response = await api.delete(`/admin/quizzes/${id}`);
    return response.data || response;
  },

  async importPlainText(id, text, mode = 'append') {
    const response = await api.post(`/admin/quizzes/${id}/import`, { text, mode });
    return response.data || response;
  },

  async getQuizResults(id) {
    const response = await api.get(`/admin/quizzes/${id}/results`);
    return response.data || response;
  },

  getExportCSVUrl(id) {
    const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    return `${base}/admin/quizzes/${id}/export`;
  },

  // Student Endpoints
  async getCourseQuizzesStudent(courseId) {
    const response = await api.get(`/courses/${courseId}/quizzes`);
    return response.data || response;
  },

  async startQuizAttempt(quizId) {
    const response = await api.post(`/quizzes/${quizId}/start`);
    return response.data || response;
  },

  async saveAttemptAnswers(attemptId, answers) {
    const response = await api.patch(`/attempts/${attemptId}/answers`, { answers });
    return response.data || response;
  },

  async submitQuizAttempt(attemptId, answers) {
    const response = await api.post(`/attempts/${attemptId}/submit`, { answers });
    return response.data || response;
  },

  async getAttemptDetails(attemptId) {
    const response = await api.get(`/attempts/${attemptId}`);
    return response.data || response;
  },
};

export default quizService;
