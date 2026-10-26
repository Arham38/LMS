import api from './api';

export const announcementService = {
  async getAdminAnnouncements(courseId) {
    const response = await api.get(`/admin/courses/${courseId}/announcements`);
    return response.data || response;
  },

  async createAnnouncement(courseId, data) {
    const response = await api.post(`/admin/courses/${courseId}/announcements`, data);
    return response.data || response;
  },

  async updateAnnouncement(id, data) {
    const response = await api.put(`/admin/announcements/${id}`, data);
    return response.data || response;
  },

  async deleteAnnouncement(id) {
    const response = await api.delete(`/admin/announcements/${id}`);
    return response.data || response;
  },

  async getCourseAnnouncementsStudent(courseId) {
    const response = await api.get(`/courses/${courseId}/announcements`);
    return response.data || response;
  },
};

export default announcementService;
