import api from './api';

export const notificationService = {
  async getNotifications(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString() ? `?${query.toString()}` : '';
    const response = await api.get(`/notifications${qs}`);
    return response.data || response;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data || response;
  },

  async markAsRead(id) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data || response;
  },

  async markAllAsRead() {
    const response = await api.patch('/notifications/read-all');
    return response.data || response;
  },
};

export default notificationService;
