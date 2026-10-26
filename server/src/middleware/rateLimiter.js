import rateLimit from 'express-rate-limit';

const createLimiter = ({ windowMs, max, message, code = 'RATE_LIMITED' }) => {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message,
        code,
      });
    },
  });
};

export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: 'Too many requests from this IP. Please try again after 15 minutes.',
  code: 'RATE_LIMITED_GENERAL',
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  code: 'RATE_LIMITED_AUTH',
});

export const contactLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many inquiries submitted from this IP. Please try again after 15 minutes or message us on WhatsApp.',
  code: 'RATE_LIMITED_CONTACT',
});

export default {
  generalLimiter,
  authLimiter,
  contactLimiter,
};
