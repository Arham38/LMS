export const sendSuccess = (res, { data = null, message, statusCode = 200 } = {}) => {
  const payload = {
    success: true,
    data,
  };

  if (message) {
    payload.message = message;
  }

  return res.status(statusCode).json(payload);
};

export const sendError = (res, { message = 'An error occurred', code = 'ERROR', errors = null, statusCode = 500 } = {}) => {
  const payload = {
    success: false,
    message,
    code,
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

export const formatPagination = ({ items = [], total = 0, page = 1, limit = 20 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / parsedLimit);

  return {
    items,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages,
  };
};
