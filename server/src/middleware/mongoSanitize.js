const hasForbiddenKey = (obj) => {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasForbiddenKey(obj[key])) {
        return true;
      }
    }
  }
  return false;
};

export const sanitizeKeys = (req, res, next) => {
  if (
    hasForbiddenKey(req.body) ||
    hasForbiddenKey(req.query) ||
    hasForbiddenKey(req.params)
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid characters in request keys ($ or . are forbidden)',
      code: 'FORBIDDEN_KEY_PATTERN',
    });
  }
  next();
};

export default sanitizeKeys;
