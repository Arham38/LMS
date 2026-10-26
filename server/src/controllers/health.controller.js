import { sendSuccess } from '../utils/response.js';

export const getHealth = (req, res) => {
  return sendSuccess(res, {
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
    },
    message: 'System operational',
  });
};

export default {
  getHealth,
};
