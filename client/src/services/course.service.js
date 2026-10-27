import api from './api';

export const courseService = {
  async getPublicCourses() {
    const response = await api.get('/courses');
    return response.data || response;
  },

  async getCourseBySlug(slug) {
    const response = await api.get(`/courses/${slug}`);
    return response.data || response;
  },

  async getAdminCourses(params = {}) {
    const response = await api.get('/admin/courses', { params });
    return response.data || response;
  },

  async getCoursesAdmin(params = {}) {
    return this.getAdminCourses(params);
  },

  async getAdminCourseById(id) {
    const response = await api.get(`/admin/courses/${id}`);
    return response.data || response;
  },

  async createCourse(data) {
    const response = await api.post('/admin/courses', data);
    return response.data || response;
  },

  async updateCourse(id, data) {
    const response = await api.put(`/admin/courses/${id}`, data);
    return response.data || response;
  },

  async deleteCourse(id) {
    const response = await api.delete(`/admin/courses/${id}`);
    return response;
  },
};

export default courseService;
