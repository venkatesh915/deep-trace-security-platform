const { errorResponse } = require('../utils/apiResponse');

/**
 * Centralized Global Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  // If response has already started sending headers, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error('Unhandled Server Error:', {
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Handle Prisma unique constraint violations (code P2002)
  if (err.code === 'P2002') {
    const fields = err.meta && err.meta.target ? err.meta.target : 'field';
    return errorResponse(res, 409, `A record with this ${fields} already exists.`);
  }

  // Handle Prisma record not found (code P2025)
  if (err.code === 'P2025') {
    return errorResponse(res, 404, 'Requested record was not found.');
  }

  // Handle JSON parse errors from invalid body payloads
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return errorResponse(res, 400, 'Malformed JSON in request body.');
  }

  return errorResponse(
    res,
    statusCode >= 400 && statusCode < 600 ? statusCode : 500,
    message,
    statusCode >= 500 && process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

// 404 Not Found handler for undefined routes
const notFoundHandler = (req, res) => {
  return errorResponse(res, 404, `Endpoint ${req.method} ${req.originalUrl} does not exist.`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
