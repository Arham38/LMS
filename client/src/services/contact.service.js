import { api } from './api';

export const contactService = {
  /**
   * Submit public contact message
   * @param {Object} data { name, email, phone, subject, message }
   */
  async submitContactMessage(data) {
    const res = await api.post('/contact', data);
    return res.data;
  },

  /**
   * Get all contact messages for admin
   * @param {Object} params { page, limit, read, search }
   */
  async getAdminMessages(params = {}) {
    const res = await api.get('/admin/messages', { params });
    return res.data;
  },

  /**
   * Update message status (read / replied / notes)
   * @param {string} id
   * @param {Object} data { read, replySent, adminNotes }
   */
  async updateMessageStatus(id, data) {
    const res = await api.patch(`/admin/messages/${id}`, data);
    return res.data;
  },

  /**
   * Delete contact message
   * @param {string} id
   */
  async deleteMessage(id) {
    const res = await api.delete(`/admin/messages/${id}`);
    return res.data;
  },
};

export default contactService;
