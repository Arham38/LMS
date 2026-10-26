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

export const formatPagination = (optionsOrPage = {}, limitArg, totalArg) => {
  let items = [];
  let total = 0;
  let page = 1;
  let limit = 20;

  if (typeof optionsOrPage === 'object' && optionsOrPage !== null) {
    items = optionsOrPage.items || [];
    total = optionsOrPage.total || 0;
    page = optionsOrPage.page || 1;
    limit = optionsOrPage.limit || 20;
  } else {
    page = optionsOrPage || 1;
    limit = limitArg || 20;
    total = totalArg || 0;
  }

  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / parsedLimit) || 1;

  return {
    items,
    page: parsedPage,
    limit: parsedLimit,
    total,
    totalPages,
  };
};
