// A consistent shape for errors we throw on purpose (bad input, auth
// failure, not found, etc). errorHandler.js knows how to turn these into
// clean JSON responses instead of leaking stack traces to the client.
class AppError extends Error {
  constructor(message, statusCode, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // distinguishes expected errors from bugs
    this.code = code; // machine-readable code for the frontend, e.g. 'INVALID_CREDENTIALS'
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
