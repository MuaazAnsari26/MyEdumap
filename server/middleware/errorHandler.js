const { env } = require('../config/env');

// Translates common Mongoose/JWT errors into operational AppError-shaped
// responses so the frontend always gets a predictable, friendly message.
function normalizeError(err) {
  let error = { ...err, message: err.message, statusCode: err.statusCode, code: err.code };

  if (err.name === 'CastError') {
    error = { statusCode: 400, message: 'Invalid identifier supplied.', code: 'INVALID_ID' };
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error = {
      statusCode: 409,
      message: `That ${field} is already in use.`,
      code: 'DUPLICATE_FIELD',
    };
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors || {})
      .map((e) => e.message)
      .join(' ');
    error = { statusCode: 400, message: message || 'Invalid data provided.', code: 'VALIDATION_ERROR' };
  }

  if (err.name === 'JsonWebTokenError') {
    error = { statusCode: 401, message: 'Invalid session. Please log in again.', code: 'INVALID_TOKEN' };
  }

  if (err.name === 'TokenExpiredError') {
    error = { statusCode: 401, message: 'Your session has expired. Please log in again.', code: 'TOKEN_EXPIRED' };
  }

  if (err.name === 'MulterError') {
    const messages = {
      LIMIT_FILE_SIZE: 'That file is too large. The maximum size is 10MB.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload.',
    };
    error = {
      statusCode: 400,
      message: messages[err.code] || 'There was a problem uploading that file.',
      code: err.code || 'UPLOAD_ERROR',
    };
  }

  return error;
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const isOperational = err.isOperational || !!normalized.code;

  if (env.nodeEnv !== 'production') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const message =
    isOperational || statusCode < 500
      ? normalized.message
      : 'Something went wrong on our end. Please try again.';

  res.status(statusCode).json({
    success: false,
    message,
    code: normalized.code || 'INTERNAL_ERROR',
    ...(env.nodeEnv !== 'production' && !isOperational ? { stack: err.stack } : {}),
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
  });
}

module.exports = { errorHandler, notFoundHandler };
