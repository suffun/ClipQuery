/**
 * Centralized error-handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('[Backend Error]:', err.message || err);

  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};

module.exports = errorHandler;

