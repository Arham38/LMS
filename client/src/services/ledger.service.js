import api from './api';

export const ledgerService = {
  /**
   * Fetch aggregated ledger telemetry and paginated transaction entries
   * @param {Object} params - { page, limit, status, course, paymentMethod, search }
   */
  async getAdminLedger(params = {}) {
    const response = await api.get('/admin/ledger', { params });
    return response.data || response;
  },

  /**
   * Export transactions as CSV download
   * @param {Object} params - { status, course, paymentMethod }
   */
  async exportLedgerCSV(params = {}) {
    const response = await api.get('/admin/ledger/export', {
      params,
      responseType: 'blob',
    });
    return response;
  },
};

export default ledgerService;
